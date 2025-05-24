'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { generateUniqueCurrencyCode } from '@/utils/generateCurrencyCode';
import { isForbiddenCode } from '@/utils/validateCurrencyCode';

export default function CurrencyIssueForm() {
  const [alreadyIssued, setAlreadyIssued] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkIssued = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const q = query(
        collection(db, 'currencies'),
        where('ownerId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      setAlreadyIssued(snapshot.size > 0);
      setLoading(false);
    };

    checkIssued();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!auth.currentUser) return;

    if (name.length < 3 || name.length > 6) {
      setMessage('通貨名は3〜6文字で入力してください。');
      return;
    }

    if (isForbiddenCode(name)) {
      setMessage('この通貨名は使用できません。');
      return;
    }

    const code = await generateUniqueCurrencyCode(async (candidate) => {
      const q = query(collection(db, 'currencies'), where('code', '==', candidate));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    });

    try {
      await addDoc(collection(db, 'currencies'), {
        name,
        unit,
        totalSupply: 0,
        description,
        iconUrl,
        code,
        ownerId: auth.currentUser.uid,
        ownerName: auth.currentUser.displayName || '',
        ownerDisplayId: '', // Firestoreのユーザーデータから取得も可能
        createdAt: serverTimestamp(),
      });

      setMessage('通貨を発行しました！');
      setName('');
      setUnit('');
      setDescription('');
      setIconUrl('');
    } catch (err) {
      console.error(err);
      setMessage('発行に失敗しました。');
    }
  };

  if (loading) return <p>確認中...</p>;
  if (alreadyIssued) return <p>このユーザーは既に通貨を発行しています。</p>;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">
      <h2 className="text-lg font-bold">通貨の発行</h2>

      {message && <p className="text-sm text-blue-600">{message}</p>}

      <div>
        <label className="block text-sm">通貨名（3〜6文字）</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm">単位</label>
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full border p-2 rounded"
          required
          maxLength={10}
        />
      </div>

      <div>
        <label className="block text-sm">説明</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm">アイコンURL</label>
        <input
          type="url"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {iconUrl && (
          <img
            src={iconUrl}
            alt="アイコンプレビュー"
            className="w-20 h-20 mt-2 rounded-full object-cover mx-auto"
          />
        )}
      </div>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        発行する
      </button>
    </form>
  );
}
