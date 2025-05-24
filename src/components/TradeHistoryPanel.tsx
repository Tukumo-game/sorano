'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

type Distribution = {
  currencyCode: string;
  from: string;
  to: string;
  amount: number;
  createdAt: Timestamp;
};

type CurrencyInfo = {
  name: string;
  unit: string;
};

export default function TradeHistoryPanel() {
  const [histories, setHistories] = useState<Distribution[]>([]);
  const [currencyMap, setCurrencyMap] = useState<Record<string, CurrencyInfo>>({});
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistories = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setUid(user.uid);

      const q = query(
        collection(db, 'distributions'),
        where('from', '==', user.uid)
      );
      const q2 = query(
        collection(db, 'distributions'),
        where('to', '==', user.uid)
      );

      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(q),
        getDocs(q2),
      ]);

      const sentData = sentSnap.docs.map((doc) => doc.data() as Distribution);
      const receivedData = receivedSnap.docs.map((doc) => doc.data() as Distribution);
      const all = [...sentData, ...receivedData].sort((a, b) => {
        return b.createdAt?.toMillis() - a.createdAt?.toMillis();
      });

      // 対応する通貨情報を取得
      const codeSet = new Set(all.map((d) => d.currencyCode));
      const codeArr = Array.from(codeSet);
      const map: Record<string, CurrencyInfo> = {};

      for (const code of codeArr) {
        const curSnap = await getDocs(
          query(collection(db, 'currencies'), where('code', '==', code))
        );
        if (!curSnap.empty) {
          const data = curSnap.docs[0].data();
          map[code] = {
            name: data.name,
            unit: data.unit,
          };
        }
      }

      setCurrencyMap(map);
      setHistories(all);
      setLoading(false);
    };

    fetchHistories();
  }, []);

  if (loading) return <p>履歴を取得中...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">取引履歴</h2>

      {histories.length === 0 ? (
        <p>取引履歴はありません。</p>
      ) : (
        <ul className="space-y-4">
          {histories.map((item, i) => {
            const isSent = item.from === uid;
            const info = currencyMap[item.currencyCode];
            const direction = isSent ? '→ 送信' : '← 受信';
            const color = isSent ? 'text-red-600' : 'text-green-600';

            return (
              <li key={i} className="border p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">
                  {item.createdAt?.toDate().toLocaleString('ja-JP')}
                </p>
                <p className={`font-semibold ${color}`}>
                  {info?.name || item.currencyCode} {direction}：{item.amount.toLocaleString()} {info?.unit || ''}
                </p>
                <p className="text-sm text-gray-500">
                  {isSent ? `→ 相手ID: ${item.to}` : `← 相手ID: ${item.from}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
