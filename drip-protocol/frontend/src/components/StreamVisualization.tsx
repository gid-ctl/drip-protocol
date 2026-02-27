import { motion } from "framer-motion";
import { Wallet, ArrowRight } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

const PARTICLES = [0, 1, 2, 3, 4];

export function StreamVisualization() {
  const streamed = useCountUp(0.42, 1800);

  return (
    <div className="w-full max-w-lg mx-auto mt-10">
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 sm:p-6 backdrop-blur-sm">
        {/* Stream bar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Sender */}
          <div className="flex flex-col items-center gap-1.5 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Sender</span>
          </div>

          {/* Flow bar */}
          <div className="flex-1 relative h-8 sm:h-10 flex items-center">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-border/60 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full gradient-primary"
                initial={{ width: "0%" }}
                animate={{ width: "42%" }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
              />
            </div>
            {/* Particles */}
            {PARTICLES.map((i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full gradient-primary"
                style={{ left: "0%" }}
                animate={{
                  left: ["0%", "100%"],
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1, 1, 0.5],
                }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* Recipient */}
          <div className="flex flex-col items-center gap-1.5 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Recipient</span>
          </div>
        </div>

        {/* Progress label */}
        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-sm font-mono text-muted-foreground">
            <span className="text-foreground font-semibold">{streamed.toFixed(2)}</span>
            {" / 1.00 sBTC streamed"}
          </p>
        </div>
      </div>
    </div>
  );
}
