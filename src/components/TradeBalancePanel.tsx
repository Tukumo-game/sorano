'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';

type BalanceItem = {
  currencyCode: string;
  amount: number;
};

type CurrencyInfo = {
  name: string;
  unit: string;
};

export default function TradeBalancePanel() {
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [currencyMap, setCurrencyMap] = useState<Record<string, CurrencyInfo>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchBalances = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'balances'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => doc.data() as BalanceItem);
      setBalances(data);

      const infoMap: Record<string, CurrencyInfo> = {};
      for (const bal of data) {
        const curSnap = await getDocs(
          query(collection(db, 'currencies'), where('code', '==', bal.currencyCode))
        );
        if (!curSnap.empty) {
          const info = curSnap.docs[0].data();
          infoMap[bal.currencyCode] = {
            name: info.name,
            unit: info.unit,
          };
        }
      }

      setCurrencyMap(infoMap);
      setLoading(false);
    };

    fetchBalances();
  }, []);

  const handleDelete = async (currencyCode: string, amount: number) => {
    const confirmed = window.confirm(
      `この通貨（${currencyMap[currencyCode]?.name || currencyCode}）を削除しますか？\n残高：${amount}\n※削除後は元に戻せません`
    );
    if (!confirmed) return;

    const user = auth.currentUser;
    if (!user) return;

    const balanceId = `${user.uid}_${currencyCode}`;
    const balanceRef = doc(db, 'balances', balanceId);
    await deleteDoc(balanceRef);

    const currencySnap = await getDocs(
      query(collection(db, 'currencies'), where('code', '==', currencyCode))
    );
    if (!currencySnap.empty) {
      const currencyId = currencySnap.docs[0].id;
      const currencyRef = doc(db, 'currencies', currencyId);
      await updateDoc(currencyRef, {
        totalSupply: increment(-amount),
      });
    }

    setBalances((prev) =>
      prev.filter((b) => b.currencyCode !== currencyCode)
    );

    setMessage('通貨を削除しました。');
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">所持通貨一覧</h2>

      {message && <p className="text-blue-600 text-sm">{message}</p>}

      {balances.length === 0 ? (
        <p className="text-sm text-gray-500">所持している通貨はありません。</p>
      ) : (
        <ul className="space-y-3">
          {balances.map((bal) => {
            const info = currencyMap[bal.currencyCode];
            return (
              <li
                key={bal.currencyCode}
                className="border p-3 rounded flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {info?.name || bal.currencyCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {bal.amount.toLocaleString()} {info?.unit || ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(bal.currencyCode, bal.amount)}
                  className="text-sm text-white bg-gray-500 hover:bg-red-600 px-3 py-1 rounded"
                >
                  削除
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
