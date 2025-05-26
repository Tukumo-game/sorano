import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateDisplayId } from '../utils/generateDisplayId';
import { auth } from '../firebase/config';

const DISPLAY_ID_LENGTH = 7;

// 一意な表示IDを生成する
async function generateUniqueDisplayId(): Promise<string> {
  const usersRef = collection(db, 'users');

  let unique = false;
  let displayId = '';

  while (!unique) {
    displayId = generateDisplayId(DISPLAY_ID_LENGTH);
    const q = query(usersRef, where('displayId', '==', displayId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      unique = true;
    }
  }

  return displayId;
}

export async function registerUserIfFirstTime(
  uid: string,
  userName: string,
  email?: string
) {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    return { isNew: false, displayId: docSnap.data().displayId };
  }

  const displayId = await generateUniqueDisplayId();

  const userData: any = {
    userName,
    displayId,
    role: "user",
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    photoURL: auth.currentUser?.photoURL || '', 
    currencyLimit: 1 ,
    locale: "ja",
    isBanned: false
  };

  if (email) {
    userData.email = email;
  }

  await setDoc(userRef, userData);

  return { isNew: true, displayId };
}

