'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import SignOutButton from '@/components/SignOutButton';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/config';

const tabs = [
  { name: 'ホーム', path: '/home' },
  { name: '通貨', path: '/currency' },
  { name: '取引', path: '/trade' },
  { name: 'フレンド', path: '/friends' },
  { name: '設定', path: '/settings' },
];

export default function TabsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row w-full min-h-screen">
      {/* 左側タブ（PC用） */}
      {user && (
        <nav className="hidden sm:flex w-40 bg-gray-100 p-4 flex-col gap-4">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              href={tab.path}
              className={`py-2 px-4 rounded ${
                pathname === tab.path
                  ? 'bg-green-600 text-white'
                  : 'text-gray-800 hover:bg-gray-200'
              }`}
            >
              {tab.name}
            </Link>
          ))}
          <div className="mt-20">
            <SignOutButton />
          </div>
        </nav>
      )}

      {/* メイン表示エリア */}
      <main className="flex-1 pb-16 sm:pb-0 p-4 sm:p-6">{children}</main>

      {/* モバイル用ボトムタブ */}
      {user && (
        <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-gray-100 flex justify-around border-t">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex-1 text-center py-3 text-sm ${
                pathname === tab.path ? 'text-green-600 font-bold' : 'text-gray-600'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
