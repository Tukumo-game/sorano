'use client'

import { useEffect, useState } from 'react';
import { auth } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { User } from 'firebase/auth';

type UserData = {
  userName: string;
  displayId: string;
  photoURL?: string;
};

export default function HomeContent() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);

    const fetchUserData = async () => {
      if (!currentUser) return;
      const ref = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as UserData;
        setUserData(data);
      }
    };

    fetchUserData();
  }, []);

  if (!user || !userData) return <p>読み込み中...</p>;

  return (
    <div className="w-full max-w-md mx-auto mt-6 px-4">
      <div className="flex flex-col items-center gap-2 mb-6">
        {userData.photoURL && (
          <img
            src={userData.photoURL}
            alt="プロフィール画像"
            className="w-20 h-20 rounded-full object-cover"
          />
        )}
        <p className="text-xl font-semibold">{userData.userName}</p>
        <p className="text-gray-600 text-sm">ID: {userData.displayId}</p>
      </div>

      <div className="bg-gray-100 rounded p-4 shadow-sm">
        <h2 className="font-bold mb-2 text-lg">お知らせ</h2>
        <ul className="list-disc list-inside text-sm text-gray-700">
          <li>このアプリは開発中です。</li>
        </ul>
      </div>
    </div>
  );
}
