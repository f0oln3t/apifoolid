"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function Contributors() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsub = onValue(ref(db, "users"), (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.values(data)
          .filter((u) => u.avatar)
          .slice(0, 10);
        setUsers(list);
      }
    });
    return unsub;
  }, []);

  if (users.length === 0) return null;

  return (
    <div className="contributors">
      <span className="contributors-label">dikontribusi oleh</span>
      <div className="contributors-avatars">
        {users.map((u, i) => (
          <Image
            key={i}
            src={u.avatar}
            alt={u.name || ""}
            title={u.name || ""}
            width={24}
            height={24}
          />
        ))}
      </div>
    </div>
  );
}
