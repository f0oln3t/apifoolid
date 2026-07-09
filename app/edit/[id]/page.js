"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ref, get, update, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast";

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

const LANGUAGES = [
  "javascript", "typescript", "python", "bash", "go", "rust",
  "java", "kotlin", "php", "ruby", "csharp", "cpp", "swift",
  "html", "css", "json",
];

export default function EditPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const showToast = useToast();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    if (!id || authLoading) return;
    (async () => {
      try {
        const snap = await get(ref(db, "apis/" + id));
        if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
        const data = snap.val();
        if (!user || user.uid !== data.authorUid) { setUnauthorized(true); setLoading(false); return; }
        setForm({
          title: data.title || "",
          method: data.method || "GET",
          description: data.description || "",
          category: data.category || "lainnya",
          tags: (data.tags || []).join(", "),
          endpoint: data.endpoint || "",
          repoUrl: data.repoUrl || "",
          readme: data.readme || "",
          code: data.code || "",
          language: data.language || "javascript",
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        showToast("Gagal load data");
        setLoading(false);
      }
    })();
  }, [id, user, authLoading]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || !form) return;
    setMsg({ text: "", type: "" });

    if (!form.title.trim() || !form.description.trim() || !form.endpoint.trim()) {
      setMsg({ text: "Nama, deskripsi, dan endpoint wajib diisi.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      await update(ref(db, "apis/" + id), {
        title: form.title.trim(),
        slug: slugify(form.title),
        description: form.description.trim(),
        method: form.method,
        category: form.category,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 8),
        endpoint: form.endpoint.trim(),
        repoUrl: form.repoUrl.trim(),
        readme: form.readme,
        code: form.code,
        language: form.language,
        updatedAt: serverTimestamp(),
      });

      setMsg({ text: "Berhasil disimpan!", type: "ok" });
      showToast("API berhasil diedit 🎉");
      setTimeout(() => router.push("/item/" + id), 1200);
    } catch (err) {
      console.error(err);
      setMsg({ text: "Gagal: " + err.message, type: "error" });
      setSaving(false);
    }
  }

  if (authLoading || loading) return null;
  if (notFound) return <div className="empty-state" style={{ marginTop: 60 }}>API nggak ditemukan.</div>;
  if (unauthorized) return <div className="empty-state" style={{ marginTop: 60 }}>Lu bukan pemilik API ini.</div>;
  if (!user) return <div className="empty-state" style={{ marginTop: 60 }}>Login dulu bro.</div>;
  if (!form) return null;

  return (
    <form className="form-wrap" onSubmit={handleSubmit}>
      <h1 className="form-title">// edit API</h1>
      <p className="form-desc">Edit detail endpoint & kode snippet kamu.</p>

      <div className="two-col">
        <div className="field">
          <label htmlFor="title">Nama API</label>
          <input id="title" required placeholder="cth: TikTok Downloader" value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="method">Method</label>
          <select id="method" value={form.method} onChange={(e) => update("method", e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Deskripsi singkat</label>
        <textarea id="description" required style={{ minHeight: 70 }} placeholder="API ini ngapain..." value={form.description} onChange={(e) => update("description", e.target.value)} />
      </div>

      <div className="two-col">
        <div className="field">
          <label htmlFor="category">Kategori</label>
          <select id="category" value={form.category} onChange={(e) => update("category", e.target.value)}>
            <option value="downloader">downloader</option>
            <option value="search">search</option>
            <option value="anime">anime</option>
            <option value="ai">ai</option>
            <option value="tools">tools</option>
            <option value="sosmed">sosmed</option>
            <option value="lainnya">lainnya</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="tags">Tags (pisah koma)</label>
          <input id="tags" placeholder="tiktok, downloader, video" value={form.tags} onChange={(e) => update("tags", e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="endpoint">Contoh endpoint / URL request</label>
        <input id="endpoint" required className="mono" placeholder="https://api-kamu.vercel.app/..." value={form.endpoint} onChange={(e) => update("endpoint", e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="repoUrl">Link repo GitHub (opsional)</label>
        <input id="repoUrl" className="mono" placeholder="https://github.com/username/repo" value={form.repoUrl} onChange={(e) => update("repoUrl", e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="readme">README.md</label>
        <textarea id="readme" className="readme-editor mono" value={form.readme} onChange={(e) => update("readme", e.target.value)} />
        <span className="hint">Markdown — jelasin cara pake API kamu.</span>
      </div>

      <div className="field">
        <label htmlFor="language">Bahasa</label>
        <select id="language" value={form.language} onChange={(e) => update("language", e.target.value)}>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="code">Kode Snippet</label>
        <textarea id="code" className="readme-editor mono" value={form.code} onChange={(e) => update("code", e.target.value)} />
        <span className="hint">Kode siap pakai yang bisa langsung di-copy orang.</span>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/item/" + id)}>Batal</button>
        {msg.text && <span className={`form-msg ${msg.type}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
