"use client";

import { useEffect, useRef } from "react";

/**
 * Floating particles that drift upward like fireflies in the night.
 * Pure CSS animation — no canvas, no JS animation loop.
 */
export default function StarField() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const COUNT = 35;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < COUNT; i++) {
      const star = document.createElement("div");
      star.className = "star";

      const x = Math.random() * 100;
      const size = Math.random() * 1.5 + 1;
      const duration = Math.random() * 20 + 15;
      const delay = Math.random() * 20;
      const opacity = Math.random() * 0.4 + 0.1;

      star.style.left = `${x}%`;
      star.style.bottom = `-${Math.random() * 10}%`;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.animationDuration = `${duration}s`;
      star.style.animationDelay = `${delay}s`;
      star.style.background = `rgba(255, 255, 255, ${opacity})`;

      fragment.appendChild(star);
    }

    el.appendChild(fragment);

    return () => {
      el.innerHTML = "";
    };
  }, []);

  return <div ref={containerRef} className="stars" />;
}
