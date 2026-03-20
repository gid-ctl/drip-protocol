import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Activity } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useStreams } from "@/hooks/use-streams";
import { fromSmallestUnit } from "@/lib/stacks";
import { usePrices, formatUsd } from "@/hooks/use-prices";

interface StatsCardsProps {
  useMockData?: boolean;
}

export function StatsCards({ useMockData = false }: StatsCardsProps) {
  const { streams, isLoading } = useStreams();
  const { stxPrice, sbtcPrice } = usePrices();
  
  const activeCount = streams.activeOutgoingCount + streams.activeIncomingCount;
  
  // Convert per-token totals
  const streamingStx = fromSmallestUnit(streams.totalStreamingStx, 'STX');
  const streamingSbtc = fromSmallestUnit(streams.totalStreamingSbtc, 'sBTC');
  const receivedStx = fromSmallestUnit(streams.totalReceivedStx, 'STX');
  const receivedSbtc = fromSmallestUnit(streams.totalReceivedSbtc, 'sBTC');
  
  // Total USD values
  const streamingUsd = streamingStx * stxPrice + streamingSbtc * sbtcPrice;
  const receivedUsd = receivedStx * stxPrice + receivedSbtc * sbtcPrice;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-live="polite">
      {/* Total Streaming */}
      <Card className="gradient-card border-border/50 hover:glow-amber transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Streaming</span>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold tracking-tight font-mono">
            <AnimatedNumber value={streamingStx} decimals={4} suffix=" STX" />
          </p>
          <p className="text-lg font-bold tracking-tight font-mono text-muted-foreground/80">
            <AnimatedNumber value={streamingSbtc} decimals={6} suffix=" sBTC" />
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatUsd(streamingUsd)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{streams.activeOutgoingCount} outgoing streams</p>
        </CardContent>
      </Card>

      {/* Total Received */}
      <Card className="gradient-card border-border/50 hover:glow-amber transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Received</span>
            <ArrowDownLeft className="h-4 w-4 text-accent" />
          </div>
          <p className="text-2xl font-bold tracking-tight font-mono">
            <AnimatedNumber value={receivedStx} decimals={4} suffix=" STX" />
          </p>
          <p className="text-lg font-bold tracking-tight font-mono text-muted-foreground/80">
            <AnimatedNumber value={receivedSbtc} decimals={6} suffix=" sBTC" />
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatUsd(receivedUsd)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime withdrawn</p>
        </CardContent>
      </Card>

      {/* Active Streams */}
      <Card className="gradient-card border-border/50 hover:glow-amber transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Active Streams</span>
            <Activity className="h-4 w-4 text-success" />
          </div>
          <p className="text-2xl font-bold tracking-tight font-mono">
            <AnimatedNumber value={activeCount} decimals={0} suffix="" />
          </p>
          <p className="text-xs text-muted-foreground mt-1">{streams.activeOutgoingCount} out · {streams.activeIncomingCount} in</p>
        </CardContent>
      </Card>
    </div>
  );
}
