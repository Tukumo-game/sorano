'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { distributeCurrency } from '@/lib/distributeCurrency';

type Currency = {
  id: string;
  name: string;
  unit: string;
  code: string;
  description: string;
  iconUrl?: string;
  totalSupply: number;
  createdAt: Timestamp;
};

type Friend = {
  id: string;
  displayId: string;
  userName: string;
  photoUrl?: string;
};

export default function CurrencyManagePanel() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [animatedTotals, setAnimatedTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [selectedCode, setSelectedCode] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const [recipientType, setRecipientType] = useState<'id' | 'friend' | 'self'>('id');
  const [displayId, setDisplayId] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentDisplayId, setCurrentDisplayId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newIconUrl, setNewIconUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const currencyQuery = query(collection(db, 'currencies'), where('ownerId', '==', user.uid));
      const currencySnap = await getDocs(currencyQuery);
      const data = currencySnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Currency[];
      setCurrencies(data);
      if (data.length > 0) setSelectedCode(data[0].code);
      const totals: Record<string, number> = {};
      data.forEach((c) => (totals[c.code] = c.totalSupply));
      setAnimatedTotals(totals);

      // フレンド取得
      const friendSnap = await getDocs(collection(db, 'users', user.uid, 'friends'));
      const friendList = friendSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Friend[];
      setFriends(friendList);

      const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
      if (!userSnap.empty) setCurrentDisplayId(userSnap.docs[0].data().displayId);

      setLoading(false);
    };

    fetchData();
  }, []);

  const animateTotal = (code: string, target: number) => {
    const current = animatedTotals[code] || 0;
    if (current === target) return;
    let step = current;
    const interval = setInterval(() => {
      step += Math.ceil((target - step) / 5);
      if (step >= target) {
        step = target;
        clearInterval(interval);
      }
      setAnimatedTotals((prev) => ({ ...prev, [code]: step }));
    }, 50);
  };

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const sender = auth.currentUser;
    if (!sender) {
      setMessage('ログインが必要です。');
      return;
    }

    let targetDisplayId = '';

    if (recipientType === 'self') {
      targetDisplayId = currentDisplayId;
      if (!targetDisplayId) {
        setMessage('自分の表示IDの取得に失敗しました。');
        return;
      }
    } else {
      if (!displayId.trim()) {
        setMessage('送信先が選択されていません。');
        return;
      }
      targetDisplayId = displayId.trim();
    }

    const amountNumber = Number(amount);
    const result = await distributeCurrency({
      db,
      currentUser: sender,
      currencyCode: selectedCode,
      targetDisplayId,
      amount: amountNumber,
    });

    setMessage(result.message);
    if (result.success) {
      setDisplayId('');
      setAmount('');
      const updatedSnap = await getDocs(query(collection(db, 'currencies'), where('code', '==', selectedCode)));
      const updatedDoc = updatedSnap.docs[0].data() as Currency;
      animateTotal(selectedCode, updatedDoc.totalSupply);
    }
  };

  const handleIconUpdate = async (currencyId: string) => {
    if (!newIconUrl.trim()) return;
    const ref = doc(db, 'currencies', currencyId);
    await updateDoc(ref, { iconUrl: newIconUrl.trim() });
    setEditingId(null);
    setNewIconUrl('');
    const updatedSnap = await getDocs(query(collection(db, 'currencies'), where('code', '==', selectedCode)));
    const updatedDoc = updatedSnap.docs[0].data() as Currency;
    animateTotal(selectedCode, updatedDoc.totalSupply);
  };

  const handleDeleteCurrency = async (currencyId: string) => {
    const confirm = window.confirm('この通貨を本当に削除しますか？');
    if (!confirm) return;
    await deleteDoc(doc(db, 'currencies', currencyId));
    const newList = currencies.filter(c => c.id !== currencyId);
    setCurrencies(newList);
    if (newList.length > 0) setSelectedCode(newList[0].code);
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div className="bg-white p-4 rounded shadow space-y-8">
      <div>
        <h2 className="text-lg font-bold mb-4">発行済み通貨一覧</h2>

        {currencies.length === 0 ? (
          <p>発行した通貨はありません。</p>
        ) : (
          <ul className="space-y-4">
            {currencies.map((currency, index) => (
              <li key={index} className="border p-4 rounded relative">
                <div className="flex items-center gap-4">
                  {currency.iconUrl && (
                    <img
                      src={currency.iconUrl}
                      alt="通貨アイコン"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-lg font-semibold">
                      {currency.name}（{currency.unit}）
                    </p>
                    <p className="text-sm text-gray-600">コード: {currency.code}</p>
                    <p className="text-sm text-gray-600">
                      発行日:{' '}
                      {currency.createdAt?.toDate().toLocaleDateString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      総量: {(animatedTotals[currency.code] ?? currency.totalSupply).toLocaleString()} {currency.unit}
                    </p>
                    {currency.description && (
                      <p className="text-sm mt-1">{currency.description}</p>
                    )}
                  </div>
                </div>

                {editingId === currency.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newIconUrl}
                      onChange={(e) => setNewIconUrl(e.target.value)}
                      className="border p-2 rounded w-full"
                      placeholder="新しい画像URLを入力"
                    />
                    <button
                      onClick={() => handleIconUpdate(currency.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      更新
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setNewIconUrl('');
                      }}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex justify-between">
                    <button
                      onClick={() => {
                        setEditingId(currency.id);
                        setNewIconUrl(currency.iconUrl || '');
                      }}
                      // className="text-sm text-blue-600 hover:underline"
                      className="text-sm text-white bg-blue-600 hover:bg-red-600 px-3 py-1 rounded"
                    >
                      アイコンを変更
                    </button>
                    <button
                      onClick={() => handleDeleteCurrency(currency.id)}
                      className="text-sm text-white bg-gray-500 hover:bg-red-600 px-3 py-1 rounded"
                    >
                      削除
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {currencies.length > 0 && (
        <form onSubmit={handleDistribute} className="space-y-4">
          <h2 className="text-lg font-bold">通貨の配布</h2>

          {message && <p className="text-blue-600 text-sm">{message}</p>}

          <div>
            <label className="block text-sm font-medium">配布する通貨</label>
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="w-full border p-2 rounded"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name}（{currency.unit}）
                </option>
              ))}
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
              <option value="self">自分自身に送る</option>
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
            <label className="block text-sm font-medium">配布量</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border p-2 rounded"
              required
              min={1}
            />
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            配布する
          </button>
        </form>
      )}
    </div>
  );
}
