"use client";

import { useEffect, useRef, useState } from "react";

const BOOT_LINES = [
  { prompt: "$ ", text: "curl https://api.foolid.my.id/status", cls: "out" },
  { prompt: "", text: "ok — website online, siap terima kontribusi", cls: "comment" },
  { prompt: "$ ", text: "apifoolid init", cls: "out" },
  { prompt: "", text: "> login dengan GitHub untuk mulai share kamu", cls: "comment" },
];

export default function Hero() {
  const [display, setDisplay] = useState([]);
  const [done, setDone] = useState(false);
  const endRef = useRef(null);
  const state = useRef({ line: 0, char: 0, phase: "type" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const s = state.current;

    function tick() {
      if (s.line >= BOOT_LINES.length) {
        setDone(true);
        return;
      }

      const { prompt, text, cls } = BOOT_LINES[s.line];

      if (s.phase === "type") {
        s.char++;
        setDisplay((prev) => {
          const next = [...prev];
          next[s.line] = { prompt, cls, text: text.slice(0, s.char) };
          return next;
        });
        if (s.char >= text.length) {
          s.phase = "pause";
          setTimeout(tick, 250);
        } else {
          setTimeout(tick, cls === "comment" ? 12 : 30);
        }
      } else {
        s.line++;
        s.char = 0;
        s.phase = "type";
        setTimeout(tick, 80);
      }
    }
    tick();
  }, []);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [display]);

  return (
    <section className="hero">
      <div className="terminal">
        <div className="terminal-bar">
          <span style={{ background: "#e35b5b" }}></span>
          <span style={{ background: "#f2c94c" }}></span>
          <span style={{ background: "#6fcf6f" }}></span>
          <span className="t-label">~/apifoolid</span>
        </div>
        <div className="terminal-body">
          {display.map((l, i) => (
            <div className="line" key={i}>
              {l.prompt && <span className="prompt">{l.prompt}</span>}
              <span className={l.cls}>{l.text}</span>
            </div>
          ))}
          <span ref={endRef} className={`cursor ${done ? "blink" : "active"}`}></span>
        </div>
      </div>
      <p className="hero-sub">
        <b>APi.foolid</b> tempat komunitas nge-share scrape dan APi — downloader, search,
        anime, AI, apa aja. orang
        lain tinggal pakai.
      </p>
    </section>
  );
}
