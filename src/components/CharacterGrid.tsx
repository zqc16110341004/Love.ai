"use client";

import { motion, type Variants } from "motion/react";
import { characters } from "@/lib/characters";
import { CharacterCard } from "./CharacterCard";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

export function CharacterGrid() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3"
    >
      {characters.map((character, i) => (
        <CharacterCard key={character.id} character={character} index={i} />
      ))}
    </motion.div>
  );
}
