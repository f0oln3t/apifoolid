"use client";

import Link from "next/link";
import Image from "next/image";
import { ref, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useToast } from "./Toast";

export default function ApiCard({ item, currentUser }) {
  const showToast = useToast();
  const liked = currentUser && (item.likes || []).includes(currentUser.uid);

  async function toggleLike() {
    if (!currentUser) {
      showToast("Login GitHub dulu buat ngasih like");
      return;
    }
    const newLikes = liked
      ? (item.likes || []).filter((uid) => uid !== currentUser.uid)
      : [...(item.likes || []), currentUser.uid];
    try {
      await update(ref(db, "apis/" + item.id), { likes: newLikes });
    } catch (err) {
      showToast("Gagal update like: " + err.message);
    }
  }

  return (
    <div className="card">
      <div className="card-top">
        <span className={`method-badge method-${item.method || "GET"}`}>{item.method || "GET"}</span>
        <span className="card-cat">#{item.category || "lainnya"}</span>
      </div>
      <h3>
        <Link href={`/item/${item.id}`}>{item.title}</Link>
      </h3>
      <p>
        {(item.description || "").slice(0, 110)}
        {(item.description || "").length > 110 ? "…" : ""}
      </p>
      <div className="card-endpoint">{item.endpoint}</div>
      <div className="card-foot">
        <span className="author">
          {item.authorAvatar ? (
            <Image src={item.authorAvatar} alt="" width={18} height={18} style={{ borderRadius: "50%" }} />
          ) : null}
          {item.authorName || "anon"}
        </span>
        <button className={`like-btn ${liked ? "liked" : ""}`} onClick={toggleLike}>
          ♥ {(item.likes || []).length}
        </button>
      </div>
    </div>
  );
}
