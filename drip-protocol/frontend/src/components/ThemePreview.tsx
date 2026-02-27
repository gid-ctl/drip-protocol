import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, MousePointerClick } from "lucide-react";

const LIGHT = {
  bg: "hsl(40 30% 94%)",
  card: "hsl(0 0% 100%)",
  border: "hsl(40 15% 80%)",
  text: "hsl(30 10% 15%)",
  muted: "hsl(30 10% 45%)",
  bar: "hsl(36 90% 54%)",
  barBg: "hsl(40 15% 84%)",
  dot1: "hsl(0 70% 60%)",
  dot2: "hsl(45 80% 55%)",
  dot3: "hsl(140 50% 50%)",
};

const DARK = {
  bg: "hsl(30 15% 8%)",
  card: "hsl(30 10% 12%)",
  border: "hsl(30 10% 20%)",
  text: "hsl(40 20% 92%)",
  muted: "hsl(30 8% 55%)",
  bar: "hsl(36 90% 54%)",
  barBg: "hsl(30 10% 20%)",
  dot1: "hsl(0 70% 60%)",
  dot2: "hsl(45 80% 55%)",
  dot3: "hsl(140 50% 50%)",
};

const SPARKLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { x: Math.cos(angle) * 60, y: Math.sin(angle) * 60, delay: i * 0.04 };
});

export function ThemePreview() {
  const [isDark, setIsDark] = useState(true);
  const [hasClicked, setHasClicked] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const t = isDark ? DARK : LIGHT;

  const handleClick = () => {
    if (!hasClicked) {
      setHasClicked(true);
      setShowSparkles(true);
    }
    setIsDark((d) => !d);
  };

  useEffect(() => {
    if (showSparkles) {
      const timer = setTimeout(() => setShowSparkles(false), 700);
      return () => clearTimeout(timer);
    }
  }, [showSparkles]);

  return (
    <motion.div
      className="flex flex-col items-center gap-3 mt-8"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative">
        {/* Sparkle burst */}
        <AnimatePresence>
          {showSparkles && SPARKLES.map((s, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full z-20"
              style={{ backgroundColor: "hsl(36 90% 54%)", marginLeft: -3, marginTop: -3 }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{ x: s.x, y: s.y, scale: [0, 1.2, 0.6], opacity: [1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: s.delay, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>
        {/* Pulse ring hint */}
        <AnimatePresence>
          {!hasClicked && (
            <motion.div
              className="absolute -inset-2 rounded-2xl border border-primary/30"
              initial={{ opacity: 0 }}
              animate={{
                scale: [1, 1.04, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="w-[280px] sm:w-[300px] rounded-xl overflow-hidden shadow-lg cursor-pointer relative z-10"
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={{
            backgroundColor: t.bg,
            borderColor: t.border,
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ border: "1px solid" }}
        >
          {/* Mini header */}
          <motion.div
            className="flex items-center justify-between px-4 py-2.5"
            animate={{ backgroundColor: t.card, borderColor: t.border }}
            transition={{ duration: 0.6 }}
            style={{ borderBottom: "1px solid" }}
          >
            <div className="flex items-center gap-1.5">
              <motion.div className="w-2.5 h-2.5 rounded-full" animate={{ backgroundColor: t.dot1 }} transition={{ duration: 0.6 }} />
              <motion.div className="w-2.5 h-2.5 rounded-full" animate={{ backgroundColor: t.dot2 }} transition={{ duration: 0.6 }} />
              <motion.div className="w-2.5 h-2.5 rounded-full" animate={{ backgroundColor: t.dot3 }} transition={{ duration: 0.6 }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Moon className="w-3.5 h-3.5" style={{ color: t.muted }} /> : <Sun className="w-3.5 h-3.5" style={{ color: t.muted }} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Card body */}
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <motion.span
                className="text-xs font-semibold"
                animate={{ color: t.text }}
                transition={{ duration: 0.6 }}
              >
                Active Stream
              </motion.span>
              <motion.span
                className="text-[10px] font-mono"
                animate={{ color: t.muted }}
                transition={{ duration: 0.6 }}
              >
                42%
              </motion.span>
            </div>

            {/* Progress bar */}
            <motion.div
              className="h-2 rounded-full overflow-hidden"
              animate={{ backgroundColor: t.barBg }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "42%", backgroundColor: t.bar }}
                transition={{ width: { duration: 1.5, ease: "easeOut" }, backgroundColor: { duration: 0.6 } }}
              />
            </motion.div>

            <div className="flex items-center justify-between">
              <motion.span
                className="text-sm font-mono font-bold"
                animate={{ color: t.text }}
                transition={{ duration: 0.6 }}
              >
                0.42 sBTC
              </motion.span>
              <motion.span
                className="text-[10px]"
                animate={{ color: t.muted }}
                transition={{ duration: 0.6 }}
              >
                of 1.00 sBTC
              </motion.span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-1.5">
        <AnimatePresence>
          {!hasClicked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ y: [0, -4, 0], opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.3 },
              }}
            >
              <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-xs text-muted-foreground">
          Click to toggle theme
        </p>
      </div>
    </motion.div>
  );
}
