"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

function buildUrl(base, params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => usp.set(k, v));
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}

function parseEndpoint(endpoint) {
  try {
    const url = new URL(endpoint);
    const params = {};
    url.searchParams.forEach((v, k) => {
      params[k] = v;
    });
    return { base: url.origin + url.pathname, params, valid: true };
  } catch {
    return { base: endpoint || "", params: {}, valid: false };
  }
}

function PlaygroundInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [apis, setApis] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [reqState, setReqState] = useState(null);

  useEffect(() => {
    const apisRef = ref(db, "apis");
    const unsub = onValue(
      apisRef,
      (snap) => {
        const data = snap.val();
        const list = data
          ? Object.entries(data)
              .map(([id, val]) => ({ id, ...val }))
              .reverse()
          : [];
        setApis(list);
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

  useEffect(() => {
    const fromQuery = searchParams.get("api");
    if (fromQuery) {
      setSelectedId(fromQuery);
    } else if (!selectedId && apis.length) {
      setSelectedId(apis[0].id);
    }
  }, [apis]);

  const filteredApis = useMemo(() => {
    if (!search.trim()) return apis;
    const term = search.trim().toLowerCase();
    return apis.filter((a) => [a.title, a.category, a.endpoint].join(" ").toLowerCase().includes(term));
  }, [apis, search]);

  const selected = useMemo(() => apis.find((a) => a.id === selectedId) || null, [apis, selectedId]);
  const parsed = useMemo(() => parseEndpoint(selected?.endpoint || ""), [selected]);

  useEffect(() => {
    setParamValues(parsed.params);
    setReqState(null);
  }, [selected?.id]);

  function selectApi(id) {
    setSelectedId(id);
    router.replace(`/playground?api=${id}`, { scroll: false });
  }

  function updateParam(key, value) {
    setParamValues((p) => ({ ...p, [key]: value }));
  }

  const finalUrl = selected ? buildUrl(parsed.base, paramValues) : "";

  async function runRequest() {
    if (!selected) return;
    setReqState("loading");
    const start = performance.now();
    try {
      const res = await fetch(finalUrl, { method: selected.method || "GET" });
      const text = await res.text();
      const ms = Math.round(performance.now() - start);
      let body = text;
      let isJson = false;
      try {
        body = JSON.parse(text);
        isJson = true;
      } catch {
      }
      setReqState({ ok: res.ok, status: res.status, ms, body, isJson });
    } catch (err) {
      const ms = Math.round(performance.now() - start);
      setReqState({ error: true, ms, message: err.message });
    }
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="playground-shell">
      <aside className="pg-sidebar">
        <div className="pg-sidebar-search">
          <input
            type="search"
            placeholder="cari api..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pg-list">
          {!loaded && <div className="pg-empty" style={{ padding: 12 }}>memuat...</div>}
          {loaded && loadError && (
            <div className="pg-empty" style={{ padding: 12 }}>gagal load data.</div>
          )}
          {loaded && !loadError && filteredApis.length === 0 && (
            <div className="pg-empty" style={{ padding: 12 }}>nggak ada yang cocok.</div>
          )}
          {loaded &&
            !loadError &&
            filteredApis.map((a) => (
              <button
                key={a.id}
                className={`pg-item ${selectedId === a.id ? "active" : ""}`}
                onClick={() => selectApi(a.id)}
              >
                <span className={`method-badge method-${a.method || "GET"}`}>{a.method || "GET"}</span>
                <span className="pg-title">{a.title}</span>
              </button>
            ))}
        </div>
      </aside>

      <main className="pg-main">
        {!selected && loaded && !loadError && (
          <div className="empty-state">
            {apis.length === 0
              ? "belum ada API buat dicoba — share dulu di /submit"
              : "pilih salah satu API di sebelah kiri buat mulai testing"}
          </div>
        )}

        {selected && (
          <>
            <div className="pg-header">
              <span className={`method-badge method-${selected.method || "GET"}`}>
                {selected.method || "GET"}
              </span>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
            </div>

            <div className="pg-params">
              <h3>// query params</h3>
              {Object.keys(paramValues).length === 0 ? (
                <p className="pg-no-params">
                  Endpoint ini nggak punya query param yang kedetect. Kamu masih bisa langsung kirim
                  request ke URL-nya apa adanya.
                </p>
              ) : (
                Object.keys(paramValues).map((key) => (
                  <div className="pg-param-row" key={key}>
                    <label htmlFor={`pg-${key}`} title={key}>
                      {key}
                    </label>
                    <input
                      id={`pg-${key}`}
                      className="mono"
                      value={paramValues[key]}
                      onChange={(e) => updateParam(key, e.target.value)}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="endpoint-block">
              <span>{finalUrl}</span>
              <button className="copy-btn" onClick={() => copyText(finalUrl)}>
                copy
              </button>
            </div>

            <div className="pg-actions">
              <button className="btn btn-primary" onClick={runRequest} disabled={reqState === "loading"}>
                {reqState === "loading" ? "Mengirim..." : "Kirim Request"}
              </button>
              <a className="btn btn-ghost" href={finalUrl} target="_blank" rel="noopener noreferrer">
                Buka di tab baru
              </a>
            </div>

            <div className="pg-response">
              <div className="pg-response-head">
                <h3 style={{ margin: 0 }}>// response</h3>
                {reqState && reqState !== "loading" && !reqState.error && (
                  <>
                    <span className={`status-pill ${reqState.ok ? "status-ok" : "status-err"}`}>
                      {reqState.status}
                    </span>
                    <span className="pg-time">{reqState.ms}ms</span>
                  </>
                )}
                {reqState && reqState !== "loading" && reqState.error && (
                  <span className="status-pill status-err">GAGAL</span>
                )}
                {reqState === "loading" && <span className="status-pill status-pending">...</span>}
              </div>

              {!reqState && <p className="pg-empty">belum ada request dikirim.</p>}

              {reqState && reqState !== "loading" && !reqState.error && (
                <>
                  <pre>
                    <code>
                      {reqState.isJson ? JSON.stringify(reqState.body, null, 2) : String(reqState.body)}
                    </code>
                  </pre>
                  <div className="pg-actions" style={{ marginTop: 12, marginBottom: 0 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() =>
                        copyText(reqState.isJson ? JSON.stringify(reqState.body, null, 2) : String(reqState.body))
                      }
                    >
                      copy response
                    </button>
                  </div>
                </>
              )}

              {reqState && reqState !== "loading" && reqState.error && (
                <div className="pg-error-note">
                  Request gagal dari browser: <span className="mono">{reqState.message}</span>.
                  <br />
                  Ini biasanya karena server API-nya belum ngizinin akses browser langsung (CORS),
                  bukan berarti API-nya rusak. Coba tombol <b>&quot;Buka di tab baru&quot;</b> di atas
                  buat lihat hasilnya langsung.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="empty-state">memuat playground...</div>}>
      <PlaygroundInner />
    </Suspense>
  );
}
