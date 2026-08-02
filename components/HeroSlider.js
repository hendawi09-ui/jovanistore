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
  // السلايدر الدائري على الموبايل:
  // بنحط نسخة من آخر سلايدة في الأول، ونسخة من أول سلايدة في الآخر.
  // أول ما توصل لنسخة، بننقل المشهد فورًا (من غير حركة) للسلايدة الحقيقية —
  // فالإحساس إنه بيلف من غير نهاية.
  const trackRef = useRef(null);
  const [mIdx, setMIdx] = useState(0);
  const mScrollTimer = useRef(null);
  const mAutoRef = useRef(null);
  const touchingRef = useRef(false);
  const readyRef = useRef(false);
  // أول ما المستخدم يقلّب بصباعه، التقليب التلقائي بيقف —
  // ويرجع لوحده بعد 6 ثواني من آخر لمسة.
  const userTookOverRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const RESUME_AFTER_MS = 6000;

  const loop = slides.length > 1;

  const slideWidth = () => trackRef.current?.getBoundingClientRect().width || 0;

  // نبدأ عند السلايدة الحقيقية الأولى (بعد النسخة اللي في الأول)
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop) {
      readyRef.current = true;
      return;
    }
    readyRef.current = false;
    const t = setTimeout(() => {
      track.scrollTo({ left: slideWidth(), behavior: "auto" });
      readyRef.current = true;
    }, 50);
    return () => clearTimeout(t);
  }, [loop, slides.length]);

  const restartMobileTimer = useCallback(() => {
    clearInterval(mAutoRef.current);
    if (userTookOverRef.current) return; // المستخدم قلّب بإيده → مفيش تقليب تلقائي تاني
    if (slides.length > 1) {
      mAutoRef.current = setInterval(() => {
        if (touchingRef.current) return;
        const track = trackRef.current;
        if (!track) return;
        const w = track.getBoundingClientRect().width;
        if (!w) return;
        const cur = Math.round(track.scrollLeft / w);
        track.scrollTo({ left: (cur + 1) * w, behavior: "smooth" });
      }, 3000);
    }
  }, [slides.length]);

  useEffect(() => {
    restartMobileTimer();
    return () => {
      clearInterval(mAutoRef.current);
      clearTimeout(resumeTimerRef.current);
    };
  }, [restartMobileTimer]);

  function handleMobileScroll() {
    clearTimeout(mScrollTimer.current);
    mScrollTimer.current = setTimeout(() => {
      const track = trackRef.current;
      if (!track || !readyRef.current) return;
      const w = track.getBoundingClientRect().width;
      if (!w) return;
      const raw = Math.round(track.scrollLeft / w);

      if (!loop) {
        setMIdx(raw);
        return;
      }

      // وصلنا لنسخة أول سلايدة (في الآخر) → ننقل للأصلية في الأول
      if (raw >= slides.length + 1) {
        track.scrollTo({ left: w, behavior: "auto" });
        setMIdx(0);
        return;
      }
      // وصلنا لنسخة آخر سلايدة (في الأول) → ننقل للأصلية في الآخر
      if (raw <= 0) {
        track.scrollTo({ left: slides.length * w, behavior: "auto" });
        setMIdx(slides.length - 1);
        return;
      }
      setMIdx(raw - 1);
    }, 90);
  }

  function onTouchStart() {
    touchingRef.current = true;
    userTookOverRef.current = true;
    clearInterval(mAutoRef.current);   // يقف من أول لمسة
    clearTimeout(resumeTimerRef.current); // ولو كان مستني يرجع، نلغي الانتظار
  }

  function onTouchEnd() {
    touchingRef.current = false;
    // بعد 6 ثواني من آخر لمسة، التقليب التلقائي يرجع لوحده
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userTookOverRef.current = false;
      restartMobileTimer();
    }, RESUME_AFTER_MS);
  }

  // النقاط: بتاخد رقم السلايدة الحقيقية وتحوّله لمكانها في المسار
  function goMobile(i) {
    const track = trackRef.current;
    if (!track) return;
    const w = track.getBoundingClientRect().width;
    track.scrollTo({ left: (loop ? i + 1 : i) * w, behavior: "smooth" });
    restartMobileTimer();
  }

  // المسار الفعلي: [نسخة الأخيرة] + السلايدات الحقيقية + [نسخة الأولى]
  const mobileSlides = loop
    ? [
        { ...slides[slides.length - 1], _clone: true },
        ...slides,
        { ...slides[0], _clone: true },
      ]
    : slides;

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
          {mobileSlides.map((s, i) => {
            const mImg = s.imageMobile || s.image; // لو مفيش صورة موبايل مخصوصة، بتتظهر صورة الديسكتوب بدالها
            return (
              <div key={`${s.id}-${i}`} className="m-slide" aria-hidden={s._clone || undefined}>
                {mImg ? <img src={mImg} alt={s.title} /> : <div className="m-slide-empty" />}
                {s.badge && <span className="m-badge">{s.badge}</span>}
                <div className="m-slide-body">
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <Link href={s.ctaLink || "#"} className="m-cta" tabIndex={s._clone ? -1 : undefined}>
                    {s.ctaLabel || "اكتشف المزيد"} ←
                  </Link>
                </div>
              </div>
            );
          })}
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
