'use client';

import { useState } from 'react';

type Props = {
  onSubmit: (displayName: string) => Promise<void>;
};

export default function DisplayNameForm({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(name.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start">
      <label className="text-sm text-gray-700">ユーザー名を入力してください</label>
      <input
        className="border rounded px-4 py-2 text-black"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例: 空野太郎"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        disabled={loading}
      >
        {loading ? '登録中...' : '登録する'}
      </button>
    </form>
  );
}
