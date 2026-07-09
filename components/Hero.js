"use client";

import { useEffect, useRef, useState } from "react";

const BOOT_LINES = [
  { prompt: "$ ", text: "curl https://apifoolid.dev/status", cls: "out" },
  { prompt: "", text: "ok — endpoint online, siap terima kontribusi", cls: "comment" },
  { prompt: "$ ", text: "apifoolid init", cls: "out" },
  { prompt: "", text: "> login dengan GitHub untuk mulai share API kamu", cls: "comment" },
];

export default function Hero() {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let lineIndex = 0;
    let charIndex = 0;

    function tick() {
      if (lineIndex >= BOOT_LINES.length) {
        setDone(true);
        return;
      }
      const { prompt, text, cls } = BOOT_LINES[lineIndex];
      charIndex++;
      setLines((prev) => {
        const next = [...prev];
        next[lineIndex] = { prompt, cls, text: text.slice(0, charIndex) };
        return next;
      });
      if (charIndex >= text.length) {
        lineIndex++;
        charIndex = 0;
        setTimeout(tick, 220);
      } else {
        setTimeout(tick, cls === "comment" ? 6 : 18);
      }
    }
    tick();
  }, []);

  return (
    <section className="hero">
      <div className="terminal">
        <div className="terminal-bar">
          <span style={{ background: "#e35b5b" }}></span>
          <span style={{ background: "#f2c94c" }}></span>
          <span style={{ background: "#6fcf6f" }}></span>
          <span className="t-label">~/apifoolid — boot.sh</span>
        </div>
        <div className="terminal-body">
          {lines.map((l, i) => (
            <div className="line" key={i}>
              {l.prompt && <span className="prompt">{l.prompt}</span>}
              <span className={l.cls}>{l.text}</span>
            </div>
          ))}
          {done && <span className="cursor"></span>}
        </div>
      </div>
      <p className="hero-sub">
        <b>APi.foolid</b> tempat komunitas nge-share API hasil scrape — downloader, search,
        anime, AI, apa aja. Login pakai GitHub, submit endpoint kamu lengkap sama README, orang
        lain tinggal pakai.
      </p>
    </section>
  );
}
