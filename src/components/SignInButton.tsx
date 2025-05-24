'use client';

import { signInWithPopup } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, provider } from '../firebase/config';
import { registerUserIfFirstTime } from '../lib/registerUser';

export default function SignInButton() {
  const [user, loading] = useAuthState(auth);

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        const res = await registerUserIfFirstTime(
          user.uid,
          user.displayName || '名無し',
          user.email || ''
        );
        if (res.isNew) {
          console.log('新規ユーザー登録完了: ', res.displayId);
        } else {
          console.log('既存ユーザー: ', res.displayId);
        }
      }
    } catch (error) {
      console.error('ログイン失敗:', error);
      alert('ログインに失敗しました');
    }
  };

  // ログイン済みなら非表示
  if (user || loading) return null;

  return (
    <button
      onClick={handleSignIn}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Googleでログイン
    </button>
  );
}
