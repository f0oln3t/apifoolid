"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ref, get, remove, update } from "firebase/database";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast";

export default function ApiDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const showToast = useToast();

  const [item, setItem] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await get(ref(db, "apis/" + id));
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setItem({ id: snap.key, ...snap.val() });
      } catch (err) {
        console.error(err);
        setLoadError(true);
      }
    })();
  }, [id]);

  async function toggleLike() {
    if (!user) {
      showToast("Login GitHub dulu buat ngasih like");
      return;
    }
    const liked = (item.likes || []).includes(user.uid);
    const newLikes = liked ? item.likes.filter((u) => u !== user.uid) : [...(item.likes || []), user.uid];
    setItem((it) => ({ ...it, likes: newLikes }));
    try {
      await update(ref(db, "apis/" + item.id), { likes: newLikes });
    } catch (err) {
      showToast("Gagal update like: " + err.message);
    }
  }

  async function copyEndpoint() {
    await navigator.clipboard.writeText(item.endpoint || "");
    showToast("Endpoint disalin ke clipboard");
  }

  async function copyCode() {
    await navigator.clipboard.writeText(item.code || "");
    showToast("Kode disalin ke clipboard");
  }

  async function handleDelete() {
    if (!confirm("Yakin hapus API ini? Nggak bisa dibalikin.")) return;
    await remove(ref(db, "apis/" + item.id));
    showToast("API dihapus");
    router.push("/");
  }

  if (loadError) {
    return <div className="empty-state" style={{ marginTop: 60 }}>gagal load — cek konsol.</div>;
  }
  if (notFound) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        API ini nggak ada — mungkin sudah dihapus.
      </div>
    );
  }
  if (!item) {
    return <div className="empty-state" style={{ marginTop: 60 }}>memuat</div>;
  }

  const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID") : "";
  const rawHtml = marked.parse(item.readme || "_Belum ada README._");
  const cleanHtml = typeof window !== "undefined" ? DOMPurify.sanitize(rawHtml) : rawHtml;
  const liked = user && (item.likes || []).includes(user.uid);
  const isOwner = user && user.uid === item.authorUid;

  return (
    <>
      <div className="detail-head">
        <div className="breadcrumb">
          <Link href="/">direktori</Link> / {item.category || "lainnya"}
        </div>
        <div className="detail-title">
          <span className={`method-badge method-${item.method || "GET"}`}>{item.method || "GET"}</span>
          <h1>{item.title}</h1>
        </div>
        <p style={{ color: "var(--text-dim)", maxWidth: 640, marginTop: 10 }}>{item.description}</p>
        <div className="detail-meta">
          <span className="author">
            {item.authorAvatar ? (
              <Image
                src={item.authorAvatar}
                alt=""
                width={18}
                height={18}
                style={{ borderRadius: "50%", verticalAlign: -4, marginRight: 4 }}
              />
            ) : null}
            {item.authorName || "anon"}
            {item.authorGithub ? (
              <>
                {" · "}
                <a href={`https://github.com/${item.authorGithub}`} target="_blank" rel="noopener noreferrer">
                  @{item.authorGithub}
                </a>
              </>
            ) : null}
          </span>
          <span>{createdAt}</span>
          {item.repoUrl && (
            <a href={item.repoUrl} target="_blank" rel="noopener noreferrer">
              repo →
            </a>
          )}
          <button className={`like-btn ${liked ? "liked" : ""}`} onClick={toggleLike}>
            ♥ {(item.likes || []).length}
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          {(item.tags || []).map((t) => (
            <span className="tag" key={t}>
              #{t}
            </span>
          ))}
        </div>
      </div>

      <div className="endpoint-block">
        <span>{item.endpoint}</span>
        <button className="copy-btn" onClick={copyEndpoint}>
          copy
        </button>
      </div>

      {item.code && (
        <div className="code-block">
          <div className="code-block-head">
            <span className="code-lang">{item.language || "code"}</span>
            <button className="copy-btn" onClick={copyCode}>copy</button>
          </div>
          <pre><code>{item.code}</code></pre>
        </div>
      )}

      <div className="readme-panel" dangerouslySetInnerHTML={{ __html: cleanHtml }} />

      {isOwner && (
        <div className="danger-zone">
          <button className="btn btn-danger" onClick={handleDelete}>
            Hapus API ini
          </button>
        </div>
      )}
    </>
  );
}
