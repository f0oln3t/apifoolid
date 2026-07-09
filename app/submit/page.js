"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ref, push, get, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { loginWithGithub } from "@/lib/auth";
import { useToast } from "@/components/Toast";

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

const INITIAL_FORM = {
  title: "",
  method: "GET",
  description: "",
  category: "downloader",
  tags: "",
  endpoint: "",
  repoUrl: "",
  readme: `## Cara pakai

\`\`\`
GET /tiktok?url=https://vt.tiktok.com/xxxx
\`\`\`

### Response
\`\`\`json
{ "status": true, "result": { "video_url": "..." } }
\`\`\`
`,
  code: `/**
 * PROJECT      : TikTok Downloader
 * AUTHOR       : Nama Kamu
 * DESC         : Scrape video TikTok tanpa watermark
 * USAGE        : node tiktok.js "https://vt.tiktok.com/xxxx"
 **/

const https = require('https');
const { URL } = require('url');

async function download(url) {
    try {
        const html = await fetch(url);
        // parsing logic here
        return { status: true, result: { video_url: "..." } };
    } catch (err) {
        return { status: false, error: err.message };
    }
}

const args = process.argv.slice(2);
if (!args[0]) {
    console.log('Cara pakai: node tiktok.js <url>');
    process.exit(0);
}
download(args[0]).then(console.log);
`,
  language: "javascript",
};

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const showToast = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleLogin() {
    try {
      await loginWithGithub();
    } catch (err) {
      console.error(err);
      showToast("Login gagal: " + (err.message || err.code));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setMsg({ text: "", type: "" });

    if (!form.title.trim() || !form.description.trim() || !form.endpoint.trim()) {
      setMsg({ text: "Nama, deskripsi, dan endpoint wajib diisi.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const userSnap = await get(ref(db, "users/" + user.uid));
      const userData = userSnap.exists() ? userSnap.val() : {};

      await push(ref(db, "apis"), {
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
        likes: [],
        authorUid: user.uid,
        authorName: userData.name || user.displayName || "Anonim",
        authorAvatar: userData.avatar || user.photoURL || "",
        authorGithub: userData.githubUsername || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMsg({ text: "Berhasil dipublikasikan! Mengarahkan ke direktori...", type: "ok" });
      showToast("API kamu sudah live 🎉");
      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      console.error(err);
      setMsg({ text: "Gagal: " + err.message, type: "error" });
      setSubmitting(false);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="gate">
        <h2 className="mono" style={{ margin: "0 0 4px" }}>
          login dulu, bro
        </h2>
        <p>Buat share Scrape kamu harus login pakai akun GitHub. Cepet kok, sekali klik.</p>
        <button className="btn btn-primary" onClick={handleLogin}>
          Login dengan GitHub
        </button>
      </div>
    );
  }

  return (
    <form className="form-wrap" onSubmit={handleSubmit}>
      <h1 className="form-title">// share API baru</h1>
      <p className="form-desc">
        Isi detail endpoint & kode snippet kamu. README buat jelasin cara pakai, Code buat kode siap pakai.
      </p>

      <div className="two-col">
        <div className="field">
          <label htmlFor="title">Nama API</label>
          <input
            id="title"
            required
            placeholder="cth: TikTok Downloader"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
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
        <textarea
          id="description"
          required
          style={{ minHeight: 70 }}
          placeholder="Scrape Untuk ngapain, bla bla bla..."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
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
          <input
            id="tags"
            placeholder="tiktok, downloader, video"
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="endpoint">Contoh endpoint / URL request</label>
        <input
          id="endpoint"
          required
          className="mono"
          placeholder="https://api-kamu.vercel.app/tiktok?url=..."
          value={form.endpoint}
          onChange={(e) => update("endpoint", e.target.value)}
        />
        <span className="hint">Endpoint yang bisa langsung dicoba orang lain.</span>
      </div>

      <div className="field">
        <label htmlFor="repoUrl">Link repo GitHub (opsional)</label>
        <input
          id="repoUrl"
          className="mono"
          placeholder="https://github.com/username/repo"
          value={form.repoUrl}
          onChange={(e) => update("repoUrl", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="readme">README.md</label>
        <textarea
          id="readme"
          className="readme-editor mono"
          value={form.readme}
          onChange={(e) => update("readme", e.target.value)}
        />
        <span className="hint">Markdown — jelasin cara pake API kamu.</span>
      </div>

      <div className="field">
        <label htmlFor="language">Bahasa</label>
        <select id="language" value={form.language} onChange={(e) => update("language", e.target.value)}>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="bash">Bash</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="java">Java</option>
          <option value="kotlin">Kotlin</option>
          <option value="php">PHP</option>
          <option value="ruby">Ruby</option>
          <option value="csharp">C#</option>
          <option value="cpp">C++</option>
          <option value="swift">Swift</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="code">Kode Snippet</label>
        <textarea
          id="code"
          className="readme-editor mono"
          value={form.code}
          onChange={(e) => update("code", e.target.value)}
        />
        <span className="hint">Kode siap pakai yang bisa langsung di-copy orang.</span>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Publikasikan API"}
        </button>
        {msg.text && <span className={`form-msg ${msg.type}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
