"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/StoreContext";

const SIZE = 44;        // قطر زرار السلة والمفضلة
const CLOSE_SIZE = 30;  // قطر زرار الطي الصغير (بيرجّعهم لدائرة الزائد)
const GAP = 8;          // المسافة بين السلة والمفضلة
const CLOSE_GAP = 3;    // زرار الطي أقرب للمفضلة
const MARGIN = 6;       // أقل مسافة من حافة الشاشة — قريب جدًا زي تطبيقات المحادثة
const DROP_SIZE = 44;   // قطر دائرة الإفلات (X) — نفس حجم الفقاعة بالظبط
const DROP_BOTTOM = 96; // ارتفاعها من أسفل الشاشة (فوق شريط التنقل)
const SNAP_RADIUS = 70; // لو مركز الفقاعة قرب من مركزها بالمسافة دي → تتقفل
const BOTTOM_NAV = 66;  // ارتفاع شريط التنقل السفلي على الموبايل — الأزرار ما تنزلش تحته
const DRAG_THRESHOLD = 6;
// حركة زنبركية (spring) — القائد أسرع شوية والتابعين أبطأ عشان يبان التتابع
const LEAD_STIFFNESS = 0.34;   // القائد بيلحق الإصبع بسرعة مع لمسة نعومة
const LEAD_DAMPING = 0.68;
const STIFFNESS = 0.15;        // التابعين
const DAMPING = 0.74;
const FLING = 7;               // قوة الاندفاع بعد رفع الإصبع
const REST_EPS = 0.15;         // تحت كده نعتبرها استقرت

export default function FloatingActions({ onOpenCart, onOpenFavorites, hidden, onHide }) {
  const { cartCount, favCount } = useStore();
  const [bump, setBump] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // مخفيين افتراضيًا عشان مساحة الشاشة
  const [dragging, setDragging] = useState(false);
  const [overDrop, setOverDrop] = useState(false); // الفقاعة فوق دائرة الإفلات؟ (للشكل)
  const overDropRef = useRef(false);               // نفس القيمة بس فورية — بنقرأها لحظة رفع الإصبع
  const [isMobile, setIsMobile] = useState(false); // السحب والإخفاء على الموبايل بس

  // الزرار القائد (السلة) وباقي الأزرار اللي بتجري وراه
  const leadRef = useRef(null);
  const followRefs = useRef([]);
  const lead = useRef({ x: 0, y: 0, vx: 0, vy: 0 });  // مكان القائد المرسوم
  const leadTarget = useRef({ x: 0, y: 0 });         // المكان اللي القائد رايح ناحيته
  const follows = useRef([]);                    // أماكن التابعين (بتلحق تدريجيًا)
  const drag = useRef({ active: false, moved: false, dx: 0, dy: 0 });
  const raf = useRef(null);

  // نتابع حجم الشاشة: الموبايل بيتحرك ويتخفي، والديسكتوب ثابت زي ما كان
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (cartCount === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [cartCount]);

  const clampPos = useCallback((x, y) => ({
    x: Math.min(Math.max(MARGIN, x), window.innerWidth - SIZE - MARGIN),
    y: Math.min(Math.max(MARGIN, y), window.innerHeight - SIZE - MARGIN - BOTTOM_NAV),
  }), []);

  // المكان الابتدائي: أسفل يسار فوق الشريط السفلي، أو المحفوظ من زيارة سابقة
  useEffect(() => {
    let start = { x: MARGIN + 4, y: window.innerHeight - SIZE - 22 - BOTTOM_NAV };
    try {
      const saved = JSON.parse(window.localStorage.getItem("jv_float") || "null");
      if (saved?.pos) start = saved.pos;
      if (typeof saved?.collapsed === "boolean") setCollapsed(saved.collapsed);
    } catch {}
    const init = clampPos(start.x, start.y);
    lead.current = { ...init, vx: 0, vy: 0 };
    leadTarget.current = { ...init };
    follows.current = [
      { ...lead.current, vx: 0, vy: 0 },
      { ...lead.current, vx: 0, vy: 0 },
    ];
  }, [clampPos]);

  const persist = useCallback((next) => {
    try {
      const prev = JSON.parse(window.localStorage.getItem("jv_float") || "{}");
      window.localStorage.setItem("jv_float", JSON.stringify({ ...prev, ...next }));
    } catch {}
  }, []);

  // حلقة الرسم: كل زرار بيلحق اللي قبله بتأخير بسيط (زي رؤوس ماسنجر)
  const tick = useCallback(() => {
    const l = lead.current;
    const lt = leadTarget.current;

    // القائد نفسه بيتحرك بزنبرك ناحية هدفه (الإصبع وقت السحب، أو الحافة بعد الرفع)
    l.vx = (l.vx + (lt.x - l.x) * LEAD_STIFFNESS) * LEAD_DAMPING;
    l.vy = (l.vy + (lt.y - l.y) * LEAD_STIFFNESS) * LEAD_DAMPING;
    if (Math.abs(l.vx) < REST_EPS && Math.abs(lt.x - l.x) < REST_EPS) { l.x = lt.x; l.vx = 0; }
    else l.x += l.vx;
    if (Math.abs(l.vy) < REST_EPS && Math.abs(lt.y - l.y) < REST_EPS) { l.y = lt.y; l.vy = 0; }
    else l.y += l.vy;

    if (leadRef.current) {
      leadRef.current.style.transform = `translate3d(${l.x}px, ${l.y}px, 0)`;
    }

    let prev = l;
    for (let i = 0; i < follows.current.length; i++) {
      const el = followRefs.current[i];
      const cur = follows.current[i];

      // المسافة بين كل زرار واللي قبله وهما مستقرين
      const sizePrev = i === 0 ? SIZE : CLOSE_SIZE;
      const gap = i === 0 ? GAP : CLOSE_GAP;
      const restOffset = i === 0 ? SIZE + gap : (SIZE + CLOSE_SIZE) / 2 + gap;

      // وقت السحب بتجري ورا اللي قبلها، ووهي مستقرة بتترصّ فوقه
      const target = drag.current.moved
        ? { x: prev.x + (SIZE - sizePrev) / 2, y: prev.y }
        : { x: prev.x + (SIZE - sizePrev) / 2, y: prev.y - restOffset };

      // فيزياء الزنبرك: تسارع ناحية الهدف مع تخفيف
      cur.vx = (cur.vx + (target.x - cur.x) * STIFFNESS) * DAMPING;
      cur.vy = (cur.vy + (target.y - cur.y) * STIFFNESS) * DAMPING;
      cur.x += cur.vx;
      cur.y += cur.vy;

      if (el) el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      prev = cur;
    }

    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!isMobile) return; // الديسكتوب ثابت — مش محتاج حلقة رسم
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [tick, collapsed, isMobile]);

  useEffect(() => {
    function onResize() {
      const c = clampPos(leadTarget.current.x, leadTarget.current.y);
      leadTarget.current = c;
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPos]);

  function onPointerDown(e) {
    drag.current = {
      active: true,
      moved: false,
      dx: e.clientX - leadTarget.current.x,
      dy: e.clientY - leadTarget.current.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  // مركز دائرة الإفلات (X) — أسفل نص الشاشة
  function dropCenter() {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight - DROP_BOTTOM - DROP_SIZE / 2,
    };
  }

  // هل مركز الفقاعة قريب كفاية من دائرة الإفلات؟
  function isOverDrop(x, y) {
    const c = dropCenter();
    const bx = x + SIZE / 2;
    const by = y + SIZE / 2;
    return Math.hypot(bx - c.x, by - c.y) < SNAP_RADIUS;
  }

  function onPointerMove(e) {
    if (!drag.current.active) return;
    const nx = e.clientX - drag.current.dx;
    const ny = e.clientY - drag.current.dy;
    if (!drag.current.moved) {
      if (Math.abs(nx - leadTarget.current.x) > DRAG_THRESHOLD || Math.abs(ny - leadTarget.current.y) > DRAG_THRESHOLD) {
        drag.current.moved = true;
        setDragging(true);
      }
    }
    if (drag.current.moved) {
      const pos = clampPos(nx, ny);
      leadTarget.current = pos;
      // لو قربت من دائرة الإفلات، بتتلزق في مركزها بالظبط زي الماسنجر
      const over = isOverDrop(pos.x, pos.y);
      overDropRef.current = over;
      setOverDrop(over);
      if (over) {
        const c = dropCenter();
        leadTarget.current = { x: c.x - SIZE / 2, y: c.y - SIZE / 2 };
      }
    }
  }

  function onPointerUp() {
    if (!drag.current.active) return;
    const wasMoved = drag.current.moved;
    drag.current.active = false;
    setDragging(false);

    // اتفلتت فوق دائرة الإكس → تتخفي (زي الماسنجر)
    if (wasMoved && overDropRef.current) {
      overDropRef.current = false;
      setOverDrop(false);
      drag.current.moved = false;
      onHide?.();
      return;
    }
    overDropRef.current = false;
    setOverDrop(false);

    if (wasMoved) {
      // اندفاع بسيط باتجاه سرعة الإصبع، وبعدين لزوق بأقرب حافة (زي ماسنجر)
      const flung = clampPos(
        lead.current.x + lead.current.vx * FLING,
        lead.current.y + lead.current.vy * FLING
      );
      const snapLeft = flung.x + SIZE / 2 < window.innerWidth / 2;
      const snapped = clampPos(
        snapLeft ? MARGIN : window.innerWidth - SIZE - MARGIN,
        flung.y
      );
      leadTarget.current = snapped;
      persist({ pos: snapped });
    }
    // نسيبها ترجع تترصّ في الحلقة الجاية
    setTimeout(() => { drag.current.moved = false; }, 0);
  }

  function guard(fn) {
    return (e) => {
      if (drag.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      fn();
    };
  }

  function toggleCollapsed(value) {
    setCollapsed(value);
    persist({ collapsed: value });
    follows.current = [
      { ...lead.current, vx: 0, vy: 0 },
      { ...lead.current, vx: 0, vy: 0 },
    ];
  }

  const dragProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  };

  // نسخة الديسكتوب: ثابتة في الركن، من غير سحب ولا إخفاء
  if (!isMobile) {
    return (
      <div className="float-static">
        <button
          className={`float-btn float-cart ${bump ? "bump" : ""}`}
          onClick={onOpenCart}
          aria-label="سلة المشتريات"
          title="سلة المشتريات"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L22 7H6" />
            <circle cx="9" cy="21" r="1.4" />
            <circle cx="18" cy="21" r="1.4" />
          </svg>
          {cartCount > 0 && <span className="float-count">{cartCount}</span>}
        </button>

        <button
          className="float-btn float-fav"
          onClick={onOpenFavorites}
          aria-label="المفضلة"
          title="المفضلة"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {favCount > 0 && <span className="float-count fav">{favCount}</span>}
        </button>
      </div>
    );
  }

  if (hidden) return null;

  // دائرة الإفلات (X) — بتظهر وسط أسفل الشاشة وقت السحب بس
  const dropZone = (
    <div className={`float-drop ${dragging ? "show" : ""} ${overDrop ? "over" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </div>
  );

  if (collapsed) {
    const total = cartCount + favCount;
    return (
      <>
        {dropZone}
        <button
          ref={leadRef}
          className={`float-btn float-show ${dragging ? "dragging" : ""} ${overDrop ? "over-drop" : ""}`}
          {...dragProps}
          onClick={guard(() => toggleCollapsed(false))}
          aria-label="إظهار الأزرار"
          title="إظهار الأزرار"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {total > 0 && <span className="float-count">{total}</span>}
        </button>
      </>
    );
  }

  return (
    <>
      {dropZone}

      {/* القائد: السلة — هو اللي بيتسحب */}
      <button
        ref={leadRef}
        className={`float-btn float-cart ${bump ? "bump" : ""} ${dragging ? "dragging" : ""} ${overDrop ? "over-drop" : ""}`}
        {...dragProps}
        onClick={guard(onOpenCart)}
        aria-label="سلة المشتريات"
        title="سلة المشتريات"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L22 7H6" />
          <circle cx="9" cy="21" r="1.4" />
          <circle cx="18" cy="21" r="1.4" />
        </svg>
        {cartCount > 0 && <span className="float-count">{cartCount}</span>}
      </button>

      {/* التابع الأول: المفضلة */}
      <button
        ref={(el) => (followRefs.current[0] = el)}
        className="float-btn float-fav"
        onClick={guard(onOpenFavorites)}
        aria-label="المفضلة"
        title="المفضلة"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
        {favCount > 0 && <span className="float-count fav">{favCount}</span>}
      </button>

      {/* التابع التاني: زرار الطي الصغير — بيرجّعهم لدائرة الزائد.
          الإخفاء الكامل لسه بالسحب لدائرة الإكس. */}
      <button
        ref={(el) => (followRefs.current[1] = el)}
        className="float-btn float-close"
        onClick={guard(() => toggleCollapsed(true))}
        aria-label="طي الأزرار"
        title="طي الأزرار"
      >
        ✕
      </button>
    </>
  );
}
