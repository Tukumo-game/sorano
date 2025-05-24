'use client'

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase/config';
import SignInButton from '@/components/SignInButton';
import UserInfo from '@/components/UserInfo';
import DisplayNameForm from '@/components/DisplayNameForm';
import { registerUserIfFirstTime } from '@/lib/registerUser';
import { updateUserName } from '@/lib/updateUserName';
import Image from 'next/image';

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const [isNewUser, setIsNewUser] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 🔄 強制再レンダー用のキー

  useEffect(() => {
    const checkUser = async () => {
      if (user) {
        const res = await registerUserIfFirstTime(
          user.uid,
          user.displayName || '名無し',
          user.email || ''
        );
        setIsNewUser(res.isNew);
      }
    };
    checkUser();
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20">
      <main className="flex flex-col items-center gap-6">
        <Image
          src="/SORANO.png" 
          alt="SORANO ロゴ"
          width={240}
          height={60}
          className="mx-auto"
        />

        {!user && <SignInButton />}

        {user && isNewUser && (
          <DisplayNameForm
            onSubmit={async (name) => {
              // await registerUserIfFirstTime(user.uid, name, user.email || '');
              await updateUserName(user.uid, name); // ユーザー名を更新
              setIsNewUser(false); // フォームを非表示にする
              setRefreshKey((prev) => prev + 1); // 🔄 UserInfo を再描画
            }}
          />
        )}

        {user && !isNewUser && <UserInfo key={refreshKey} />} {/* 🔄 リフレッシュ */}
      </main>
    </div>
  );
}
