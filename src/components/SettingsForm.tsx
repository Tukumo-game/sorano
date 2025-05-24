'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import SignOutButton from '@/components/SignOutButton';

export default function SettingsForm() {
  const [userName, setUserName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUserName(data.userName || '');
        setPhotoURL(data.photoURL || '');
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        userName: userName.trim(),
        photoURL: photoURL.trim(),
      });
      setMessage('設定を保存しました。');
    } catch (err) {
      console.error(err);
      setMessage('保存中にエラーが発生しました。');
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-xl font-bold mb-2">ユーザー設定</h2>

      {message && <p className="text-sm text-green-600">{message}</p>}

      <div>
        <label className="block text-sm font-medium">表示名</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">アイコン画像のURL</label>
        <input
          type="text"
          value={photoURL}
          onChange={(e) => setPhotoURL(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {photoURL && (
          <img
            src={photoURL}
            alt="アイコンプレビュー"
            className="w-20 h-20 mt-2 rounded-full object-cover mx-auto"
          />
        )}
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        保存
      </button>
      {/* ▼ スマホ限定のログアウトボタン */}
      <div className="sm:hidden pt-4 border-t">
        <SignOutButton />
      </div>
    </form>
  );
}
