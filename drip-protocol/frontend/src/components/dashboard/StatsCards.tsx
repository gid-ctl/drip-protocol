import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Activity } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useStreams } from "@/hooks/use-streams";
import { satsToSbtc } from "@/lib/stacks";

// BTC price for USD estimates (could be fetched from API)
const BTC_USD = 97500;

interface StatsCardsProps {
  useMockData?: boolean;
}

export function StatsCards({ useMockData = false }: StatsCardsProps) {
  const { streams, isLoading } = useStreams();
  
  // Use real data from contract
  const totalStreamingSats = streams.totalStreaming;
  const totalReceivedSats = streams.totalReceived;
  const activeCount = streams.activeOutgoingCount + streams.activeIncomingCount;
  
  // Convert to sBTC (floating point for display)
  const totalStreaming = satsToSbtc(totalStreamingSats);
  const totalReceived = satsToSbtc(totalReceivedSats);

  const stats = [
    {
      label: "Total Streaming",
      value: totalStreaming,
      decimals: 6,
      suffix: " sBTC",
      subtitle: `${streams.activeOutgoingCount} outgoing streams`,
      icon: ArrowUpRight,
      iconClass: "text-primary",
    },
    {
      label: "Total Received",
      value: totalReceived,
      decimals: 6,
      suffix: " sBTC",
      subtitle: "Lifetime withdrawn",
      icon: ArrowDownLeft,
      iconClass: "text-accent",
    },
    {
      label: "Active Streams",
      value: activeCount,
      decimals: 0,
      suffix: "",
      subtitle: `${streams.activeOutgoingCount} out · ${streams.activeIncomingCount} in`,
      icon: Activity,
      iconClass: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-live="polite">
      {stats.map((stat) => (
        <Card key={stat.label} className="gradient-card border-border/50 hover:glow-amber transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.iconClass}`} />
            </div>
            <p className="text-2xl font-bold tracking-tight font-mono">
              <AnimatedNumber value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
            </p>
            {stat.decimals > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                ≈ ${(stat.value * BTC_USD).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
