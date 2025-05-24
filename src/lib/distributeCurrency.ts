import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  increment,
  Firestore,
  deleteDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';

export async function distributeCurrency({
  db,
  currentUser,
  currencyCode,
  targetDisplayId,
  amount,
}: {
  db: Firestore;
  currentUser: User;
  currencyCode: string;
  targetDisplayId: string;
  amount: number;
}): Promise<{ success: boolean; message: string }> {
  if (!targetDisplayId.trim() || isNaN(amount) || amount <= 0) {
    return { success: false, message: '配布情報が不正です。' };
  }

  try {
    // ① 表示IDからユーザー取得
    const userSnap = await getDocs(
      query(collection(db, 'users'), where('displayId', '==', targetDisplayId))
    );
    if (userSnap.empty) {
      return { success: false, message: '指定されたユーザーが見つかりません。' };
    }
    const recipientId = userSnap.docs[0].id;

    // ② 通貨取得（code -> docId）
    const currencySnap = await getDocs(
      query(collection(db, 'currencies'), where('code', '==', currencyCode))
    );
    if (currencySnap.empty) {
      return { success: false, message: '通貨情報が見つかりません。' };
    }
    const currencyId = currencySnap.docs[0].id;

    // ③ 配布ログ追加
    const distRef = doc(collection(db, 'distributions'));
    await setDoc(distRef, {
      currencyCode,
      from: currentUser.uid,
      to: recipientId,
      amount,
      createdAt: new Date(),
    });

    // ④ 通貨供給量を加算
    const currencyRef = doc(db, 'currencies', currencyId);
    await updateDoc(currencyRef, {
      totalSupply: increment(amount),
    });

    // ⑤ 受信者の残高更新（加算）
    const recipientBalanceId = `${recipientId}_${currencyCode}`;
    const recipientBalanceRef = doc(db, 'balances', recipientBalanceId);

    const existingSnap = await getDocs(
      query(
        collection(db, 'balances'),
        where('userId', '==', recipientId),
        where('currencyCode', '==', currencyCode)
      )
    );

    if (!existingSnap.empty) {
      await updateDoc(recipientBalanceRef, {
        amount: increment(amount),
      });
    } else {
      await setDoc(recipientBalanceRef, {
        userId: recipientId,
        currencyCode,
        amount,
      });
    }

    // ⑥ 送信者の残高を減算（送信先が自分自身でない場合）
    if (currentUser.uid !== recipientId) {
      const senderBalanceId = `${currentUser.uid}_${currencyCode}`;
      const senderBalanceRef = doc(db, 'balances', senderBalanceId);
      await updateDoc(senderBalanceRef, {
        amount: increment(-amount),
      });
    }

    return { success: true, message: '送信しました！' };
  } catch (error) {
    console.error(error);
    return { success: false, message: '送信中にエラーが発生しました。' };
  }
}
