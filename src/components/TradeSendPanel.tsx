'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { distributeCurrency } from '@/lib/distributeCurrency';

type BalanceItem = {
  currencyCode: string;
  amount: number;
};

type CurrencyInfo = {
  name: string;
  unit: string;
};

type Friend = {
  id: string;
  displayId: string;
  userName: string;
  photoUrl?: string;
};

export default function TradeSendPanel() {
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [currencyMap, setCurrencyMap] = useState<Record<string, CurrencyInfo>>({});
  const [selectedCode, setSelectedCode] = useState('');
  const [targetDisplayId, setTargetDisplayId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // ▼ 新しく追加
  const [recipientType, setRecipientType] = useState<'id' | 'friend'>('id');
  const [displayId, setDisplayId] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  // const [currentDisplayId, setCurrentDisplayId] = useState('');

  useEffect(() => {
    const fetchBalances = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // 所持通貨取得
      const q = query(
        collection(db, 'balances'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => doc.data() as BalanceItem);
      setBalances(data);

      // 通貨情報取得
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
      if (data.length > 0) {
        setSelectedCode(data[0].currencyCode);
      }

      // フレンド取得
      const friendSnap = await getDocs(collection(db, 'users', user.uid, 'friends'));
      const friendList = friendSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Friend[];
      setFriends(friendList);

      setLoading(false);
    };

    fetchBalances();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const sender = auth.currentUser;
    if (!sender) return;

    const amountNumber = Number(amount);
    const selectedBalance = balances.find(b => b.currencyCode === selectedCode);
    if (!selectedBalance || amountNumber > selectedBalance.amount) {
      setMessage('所持数を超えた送信はできません。');
      return;
    }

    let targetDisplayId = displayId;

    if (!targetDisplayId) {
      setMessage('送信先が選択されていません。');
      return;
    }

    const result = await distributeCurrency({
      db,
      currentUser: sender,
      currencyCode: selectedCode,
      targetDisplayId,
      amount: amountNumber,
    });

    setMessage(result.message);
    if (result.success) {
      setTargetDisplayId('');
      setAmount('');
      setBalances((prev) =>
        prev.map((b) =>
          b.currencyCode === selectedCode
            ? { ...b, amount: b.amount - amountNumber }
            : b
        )
      );
    }
  };

  if (loading) return <p>読み込み中...</p>;
  if (balances.length === 0) return <p>通貨を所持していないため送信できません。</p>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">通貨を送信</h2>
      {message && <p className="text-blue-600 text-sm mb-2">{message}</p>}

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm">通貨の選択</label>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="w-full border p-2 rounded"
          >
            {balances.map((bal) => {
              const info = currencyMap[bal.currencyCode];
              return (
                <option key={bal.currencyCode} value={bal.currencyCode}>
                  {info?.name || bal.currencyCode}（残高: {bal.amount.toLocaleString()} {info?.unit || ''}）
                </option>
              );
            })}
          </select>
        </div>

        {/* 送信先の選択方法 */}
          <div>
            <label className="block text-sm font-medium">配布先の指定方法</label>
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value as any)}
              className="w-full border p-2 rounded"
            >
              <option value="id">表示IDで指定</option>
              <option value="friend">フレンドから選ぶ</option>
            </select>
          </div>

          {recipientType === 'id' && (
            <div>
              <label className="block text-sm font-medium">表示ID</label>
              <input
                type="text"
                value={displayId}
                onChange={(e) => setDisplayId(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
          )}

          {recipientType === 'friend' && (
            <div>
              <label className="block text-sm font-medium">フレンド選択</label>
              <select
                value={displayId}
                onChange={(e) => setDisplayId(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">-- 選択してください --</option>
                {friends.map((f) => (
                  <option key={f.displayId} value={f.displayId}>
                    {f.userName}（{f.displayId}）
                  </option>
                ))}
              </select>
            </div>
          )}

        <div>
          <label className="block text-sm">送信量</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border p-2 rounded"
            min={1}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          送信
        </button>
      </form>
    </div>
  );
}
