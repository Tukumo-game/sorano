'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

export default function UserInfo() {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserName(data.userName || user.displayName || '名無し');
            setPhotoURL(data.photoURL || null);
          }
        });

        return () => unsubscribeSnapshot();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (!user) return <p>ログインしていません</p>;

  return (
    <div className="mt-4 text-center">
      <p>ログイン中のユーザー:</p>
      <p><strong>名前:</strong> {userName ?? '取得中...'}</p>
      {photoURL && (
        <img
          src={photoURL}
          alt="ユーザーのアイコン"
          className="rounded-full w-16 h-16 mt-2 mx-auto object-cover"
        />
      )}
    </div>
  );
}
