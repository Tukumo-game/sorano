import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export async function updateUserName(uid: string, newName: string) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    userName: newName,
  });
}
