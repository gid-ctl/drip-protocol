import { ArrowRight } from "lucide-react";
import { formatAddress } from "@/lib/stacks";
import type { StreamWithMeta } from "@/hooks/use-streams";

interface Props {
  stream: StreamWithMeta;
}

export function StreamProgress({ stream }: Props) {
  const progress = stream.progressPercent;

  return (
    <div className="space-y-4">
      {/* Sender → Recipient */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Sender</p>
          <p className="font-mono">{formatAddress(stream.sender)}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Recipient</p>
          <p className="font-mono">{formatAddress(stream.recipient)}</p>
        </div>
      </div>

      <div
        className="relative h-4 w-full rounded-full bg-secondary overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Stream progress: ${progress.toFixed(1)}% vested`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            stream.status === "active" ? "gradient-primary" : stream.status === "completed" ? "bg-success" : "bg-destructive/60"
          }`}
          style={{ width: `${progress}%` }}
        />
        {stream.status === "active" && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                 style={{ backgroundSize: "200% 100%" }} />
          </div>
        )}
      </div>

      <p className="text-center text-2xl font-bold font-mono">{progress.toFixed(1)}%</p>
    </div>
  );
}
