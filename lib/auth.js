"use client";

import {
  signInWithPopup,
  signOut,
  GithubAuthProvider,
} from "firebase/auth";
import { ref, get, update, serverTimestamp } from "firebase/database";
import { auth, db, githubProvider } from "./firebase";

export async function loginWithGithub() {
  const result = await signInWithPopup(auth, githubProvider);
  const githubUsername =
    result._tokenResponse?.screenName ||
    result.user.reloadUserInfo?.screenName ||
    null;

  const userRef = ref(db, "users/" + result.user.uid);
  const snap = await get(userRef);
  const payload = {
    uid: result.user.uid,
    name: result.user.displayName || githubUsername || "Anonim",
    avatar: result.user.photoURL || "",
    githubUsername: githubUsername || (snap.exists() ? snap.val().githubUsername : ""),
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) payload.createdAt = serverTimestamp();
  await update(userRef, payload);

  return result.user;
}

export async function logout() {
  await signOut(auth);
}

// dipakai buat provider akun lain kalau nanti mau nambahin (Google, dll)
export { GithubAuthProvider };
