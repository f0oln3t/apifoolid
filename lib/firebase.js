"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GithubAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isBrowser = typeof window !== "undefined";

// Cuma init di client aja biar nggak error pas static generation / SSR
export const app = isBrowser ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const auth = isBrowser ? getAuth(app) : null;
export const db = isBrowser ? getDatabase(app) : null;

export const githubProvider = isBrowser ? (() => {
  const p = new GithubAuthProvider();
  p.addScope("read:user");
  return p;
})() : null;
