"use client";
import { useEffect, useState, useRef } from "react";

export function showToast(msg) {
  window.dispatchEvent(new CustomEvent("jv-toast", { detail: msg }));
}

export default function Toast() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    function onToast(e) {
      setMsg(e.detail);
      setShow(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setShow(false), 2400);
    }
    window.addEventListener("jv-toast", onToast);
    return () => window.removeEventListener("jv-toast", onToast);
  }, []);

  return <div className={`toast ${show ? "show" : ""}`}>{msg}</div>;
}
