'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

type Friend = {
  id: string;
  displayId: string;
  userName: string;
  photoUrl?: string;
};

export default function FriendPanel() {
  const [displayId, setDisplayId] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [myDisplayId, setMyDisplayId] = useState('');
  const [message, setMessage] = useState('');

  const fetchFriends = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // 自分の表示IDを取得
    const myDoc = await getDocs(
      query(collection(db, 'users'), where('__name__', '==', user.uid))
    );
    if (!myDoc.empty) {
      const data = myDoc.docs[0].data();
      setMyDisplayId(data.displayId || '');
    }

    const snap = await getDocs(collection(db, 'users', user.uid, 'friends'));
    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Friend[];
    setFriends(list);
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAddFriend = async () => {
    setMessage('');
    const user = auth.currentUser;
    if (!user) return;

    if (displayId === myDisplayId) {
      setMessage('自分をフレンドに追加することはできません。');
      return;
    }

    const q = query(collection(db, 'users'), where('displayId', '==', displayId));
    const snap = await getDocs(q);
    if (snap.empty) {
      setMessage('指定されたユーザーが見つかりません。');
      return;
    }

    const docData = snap.docs[0];
    const friendUid = docData.id;
    const data = docData.data();

    const ref = doc(db, 'users', user.uid, 'friends', friendUid);
    await setDoc(ref, {
      displayId: data.displayId,
      userName: data.userName,
      photoUrl: data.photoURL || '',
    });

    setMessage('フレンドを追加しました');
    setDisplayId('');
    fetchFriends();
  };

  const handleRemoveFriend = async (friendId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, 'users', user.uid, 'friends', friendId);
    await deleteDoc(ref);

    setMessage('フレンドを削除しました');
    fetchFriends();
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">フレンド管理</h2>

      <div>
        <p className="text-sm text-gray-600 mb-2">あなたの表示ID：</p>
        <div className="font-mono text-lg bg-gray-100 p-2 rounded">{myDisplayId}</div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">フレンドの表示IDを入力</label>
        <input
          type="text"
          value={displayId}
          onChange={(e) => setDisplayId(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={handleAddFriend}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          フレンド追加
        </button>
        {message && <p className="text-sm text-blue-600 mt-2">{message}</p>}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">フレンド一覧</h3>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-500">フレンドはいません。</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="border p-3 rounded flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {f.photoUrl && (
                    <img
                      src={f.photoUrl}
                      alt="アイコン"
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{f.userName}</p>
                    <p className="text-sm text-gray-600">ID: {f.displayId}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFriend(f.id)}
                  className="text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
