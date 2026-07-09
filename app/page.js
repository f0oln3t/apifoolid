"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ref, query, orderByChild, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Hero from "@/components/Hero";
import ApiCard from "@/components/ApiCard";

const CATS = ["semua", "downloader", "search", "anime", "ai", "tools", "sosmed", "lainnya"];

export default function HomePage() {
  const { user } = useAuth();
  const [apis, setApis] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const apisRef = query(ref(db, "apis"), orderByChild("createdAt"));
    const unsub = onValue(
      apisRef,
      (snap) => {
        const data = snap.val();
        if (data) {
          const list = Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .reverse();
          setApis(list);
        } else {
          setApis([]);
        }
        setLoaded(true);
      },
      (err) => {
        console.error(err);
        setLoadError(true);
        setLoaded(true);
      }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    let list = apis;
    if (activeCategory !== "semua") list = list.filter((a) => a.category === activeCategory);
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((a) =>
        [a.title, a.description, a.endpoint, ...(a.tags || [])].join(" ").toLowerCase().includes(term)
      );
    }
    return list;
  }, [apis, activeCategory, searchTerm]);

  return (
    <>
      <Hero />

      <div className="filters">
        <input
          type="search"
          className="mono"
          placeholder="cari API, endpoint, atau tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="filters">
        {CATS.map((c) => (
          <button
            key={c}
            className={`chip ${activeCategory === c ? "active" : ""}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="section-head">
        <h2>// direktori api</h2>
        <span className="count-pill">{loaded ? `${filtered.length} api` : ""}</span>
      </div>

      <div className="grid">
        {!loaded && <div className="empty-state">memuat data</div>}
        {loaded && loadError && (
          <div className="empty-state">gagal load data — cek konsol & config Database.</div>
        )}
        {loaded && !loadError && filtered.length === 0 && (
          <div className="empty-state">
            belum ada API di sini.
            <br />
            jadi yang pertama share → <Link href="/submit">/submit</Link>
          </div>
        )}
        {loaded &&
          !loadError &&
          filtered.map((item) => <ApiCard key={item.id} item={item} currentUser={user} />)}
      </div>
    </>
  );
}
