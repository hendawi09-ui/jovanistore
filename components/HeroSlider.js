"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/hero")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(data?.enabled !== false);
        const list = Array.isArray(data?.slides) ? data.slides : [];
        setSlides(list.filter((s) => s.published));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // ---------- الديسك توب: بانر كبير + نقاط ----------
  const [dIdx, setDIdx] = useState(0);
  const dTimerRef = useRef(null);

  const restartDesktopTimer = useCallback(() => {
    clearInterval(dTimerRef.current);
    if (slides.length > 1) {
      dTimerRef.current = setInterval(() => {
        setDIdx((i) => (i + 1) % slides.length);
      }, 3000);
    }
  }, [slides.length]);

  useEffect(() => {
    restartDesktopTimer();
    return () => clearInterval(dTimerRef.current);
  }, [restartDesktopTimer]);

  function goDesktop(i) {
    setDIdx(i);
    restartDesktopTimer();
  }

  function stepDesktop(dir) {
    setDIdx((i) => (i + dir + slides.length) % slides.length);
    restartDesktopTimer();
  }

  // ---------- الموبايل: سلايدر بعرض كامل قابل للمس + نقاط ----------
  const trackRef = useRef(null);
  const [mIdx, setMIdx] = useState(0);
  const mScrollTimer = useRef(null);
  const mAutoRef = useRef(null);
  const touchingRef = useRef(false);

  const scrollToMobile = useCallback((i) => {
    const track = trackRef.current;
    if (!track) return;
    const w = track.getBoundingClientRect().width;
    track.scrollTo({ left: i * w, behavior: "smooth" });
  }, []);

  // تقليب تلقائي على الموبايل كل 3 ثواني — بيقف وانت ماسك بصباعك
  const restartMobileTimer = useCallback(() => {
    clearInterval(mAutoRef.current);
    if (slides.length > 1) {
      mAutoRef.current = setInterval(() => {
        if (touchingRef.current) return;
        const track = trackRef.current;
        if (!track) return;
        const w = track.getBoundingClientRect().width;
        const cur = Math.round(track.scrollLeft / w);
        const next = (cur + 1) % slides.length;
        track.scrollTo({ left: next * w, behavior: "smooth" });
      }, 3000);
    }
  }, [slides.length]);

  useEffect(() => {
    restartMobileTimer();
    return () => clearInterval(mAutoRef.current);
  }, [restartMobileTimer]);

  function handleMobileScroll() {
    clearTimeout(mScrollTimer.current);
    mScrollTimer.current = setTimeout(() => {
      const track = trackRef.current;
      if (!track) return;
      const w = track.getBoundingClientRect().width;
      setMIdx(Math.round(track.scrollLeft / w));
    }, 80);
  }

  // وانت بتسحب بصباعك، التقليب التلقائي بيقف عشان مايقاطعكش
  function onTouchStart() {
    touchingRef.current = true;
  }
  function onTouchEnd() {
    touchingRef.current = false;
    restartMobileTimer();
  }

  function goMobile(i) {
    scrollToMobile(i);
    restartMobileTimer();
  }

  if (!loaded) return null;

  const welcome = (
    <div className="hero-welcome">
      <h1>
        مرحبًا بك في
        <br />
        <span className="brand">Jovani Store</span>
      </h1>
    </div>
  );

  // السلايدر متوقف من لوحة التحكم، أو مفيش سلايدات منشورة → جملة الترحيب بس
  if (!enabled || slides.length === 0) return welcome;

  return (
    <div className="hero-slider-wrap">
      {welcome}

      {/* ===== الديسك توب ===== */}
      <div className="hero-desktop">
        <div className="feature-panel">
          {slides.map((s, i) => (
            <div key={s.id} className={`feature-slide ${i === dIdx ? "active" : ""}`}>
              {s.badge && <span className="feature-badge">{s.badge}</span>}
              <div className="feature-text">
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <Link href={s.ctaLink || "#"} className="feature-cta">
                  {s.ctaLabel || "اكتشف المزيد"} ←
                </Link>
              </div>
              <div className="feature-img">
                {s.image ? <img src={s.image} alt={s.title} /> : <div className="feature-img-empty" />}
              </div>
            </div>
          ))}
        {slides.length > 1 && (
          <>
            <button className="fnav prev" onClick={() => stepDesktop(-1)} aria-label="السابق">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <button className="fnav next" onClick={() => stepDesktop(1)} aria-label="التالي">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          </>
        )}
        </div>
        {slides.length > 1 && (
          <div className="dots-desktop">
            {slides.map((s, i) => (
              <button
                key={s.id}
                className={i === dIdx ? "active" : ""}
                onClick={() => goDesktop(i)}
                aria-label={`سلايد ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== الموبايل ===== */}
      <div className="hero-mobile">
        <div
          className="m-track"
          ref={trackRef}
          onScroll={handleMobileScroll}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          {slides.map((s) => (
            <div key={s.id} className="m-slide">
              {s.image ? <img src={s.image} alt={s.title} /> : <div className="m-slide-empty" />}
              {s.badge && <span className="m-badge">{s.badge}</span>}
              <div className="m-slide-body">
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <Link href={s.ctaLink || "#"} className="m-cta">
                  {s.ctaLabel || "اكتشف المزيد"} ←
                </Link>
              </div>
            </div>
          ))}
        </div>
        {slides.length > 1 && (
          <div className="m-dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                className={i === mIdx ? "active" : ""}
                onClick={() => goMobile(i)}
                aria-label={`سلايد ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
