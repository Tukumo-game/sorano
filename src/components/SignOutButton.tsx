'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';

export default function SignOutButton() {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/'); // ログアウト後にログインページへ
    } catch (error) {
      console.error('ログアウト失敗:', error);
    }
  };

  if (!loggedIn) return null; // ログインしていないなら非表示

  return (
    <button
      onClick={handleSignOut}
      className="mt-auto py-2 px-4 rounded bg-red-500 text-white hover:bg-red-600"
    >
      ログアウト
    </button>
  );
}
