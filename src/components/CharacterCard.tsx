"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { GlowingEffect } from "./GlowingEffect";
import type { Character } from "@/types";

export const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.6, 0.05, 0.01, 0.9],
    },
  },
};

const MotionLink = motion.create(Link);

export function CharacterCard({ character, index }: { character: Character; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) / (rect.width / 2));
    mouseY.set((e.clientY - rect.top - rect.height / 2) / (rect.height / 2));
  };

  return (
    <motion.div
      variants={cardItemVariants}
      style={{ perspective: "1000px" }}
    >
      <MotionLink
        href={`/character/${character.id}`}
        className="character-card group relative block rounded-2xl"
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
          height: 280,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          mouseX.set(0);
          mouseY.set(0);
          setIsHovered(false);
        }}
      >
        {/* Inner container clips image/gradient content */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          {/* Background gradient fallback */}
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ background: character.cardGradient }}
          />

          {/* Portrait image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${character.avatarUrl})` }}
          />

          {/* Bottom text gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(8,8,15,0) 20%, rgba(8,8,15,0.4) 45%, rgba(8,8,15,0.88) 70%, rgba(8,8,15,0.98) 100%)",
            }}
          />

          {/* Hover shimmer overlay */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 60%)",
            }}
          />

          {/* ── Top bar ── */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 z-10">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#fff",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{
                  background: "#ff4757",
                  boxShadow: "0 0 6px rgba(255,71,87,0.6)",
                }}
              />
              在线
            </div>

            {/* Sparkle — appears on hover */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={
                isHovered
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: shouldReduceMotion ? 1 : 0.6 }
              }
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Sparkles
                className="h-4 w-4"
                style={{ color: `var(--${character.accentVar}-accent)` }}
              />
            </motion.div>
          </div>

          {/* ── Bottom info ── */}
          <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
            <motion.h2
              className="font-bold leading-none mb-1"
              animate={isHovered ? { scale: 1.03 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                fontSize: 22,
                color: "#fff",
                fontFamily: "var(--font-display), 'Songti SC', serif",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                transformOrigin: "left center",
              }}
            >
              {character.name}
            </motion.h2>

            <p
              className="text-xs mb-1.5"
              style={{
                color: `var(--${character.accentVar}-accent)`,
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              {character.tags.join(" · ")}
            </p>

            <p
              className="text-[12px] leading-relaxed line-clamp-2"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {character.description}
            </p>
          </div>
        </div>

        {/* GlowingEffect — outside overflow-hidden so border isn't clipped */}
        <GlowingEffect
          disabled={false}
          spread={28}
          borderWidth={1.5}
          proximity={60}
          inactiveZone={0.1}
          movementDuration={1.5}
        />
      </MotionLink>
    </motion.div>
  );
}
