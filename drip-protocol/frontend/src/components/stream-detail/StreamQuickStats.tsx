import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { fromSmallestUnit, blocksToApproxDays } from "@/lib/stacks";
import { usePrices, formatUsd } from "@/hooks/use-prices";
import type { StreamWithMeta } from "@/hooks/use-streams";

interface Props {
  stream: StreamWithMeta;
}

export function StreamQuickStats({ stream }: Props) {
  const { stxPrice, sbtcPrice } = usePrices();
  const tokenType = stream.tokenType || 'sBTC';
  const tokenSymbol = tokenType === 'STX' ? 'STX' : 'sBTC';
  const usdRate = tokenType === 'STX' ? stxPrice : sbtcPrice;
  const decimals = tokenType === 'STX' ? 4 : 4;
  
  const vestedAmount = fromSmallestUnit(stream.vested, tokenType);
  const withdrawnAmount = fromSmallestUnit(stream.withdrawn, tokenType);
  const withdrawableAmount = fromSmallestUnit(stream.withdrawable, tokenType);
  const remainingAmount = fromSmallestUnit(stream.totalAmount - stream.vested, tokenType);
  const durationBlocks = stream.endBlock - stream.startBlock;
  const dailyRate = durationBlocks > 0 ? fromSmallestUnit(stream.totalAmount, tokenType) / blocksToApproxDays(durationBlocks) : 0;

  const numericStats = [
    { label: "Vested", value: vestedAmount, decimals, suffix: ` ${tokenSymbol}` },
    { label: "Withdrawn", value: withdrawnAmount, decimals, suffix: ` ${tokenSymbol}` },
    { label: "Withdrawable", value: withdrawableAmount, decimals, suffix: ` ${tokenSymbol}` },
    { label: "Remaining", value: remainingAmount, decimals, suffix: ` ${tokenSymbol}` },
  ];

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4" aria-live="polite">
          {numericStats.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-mono font-medium">
                <AnimatedNumber value={s.value} decimals={s.decimals} suffix={s.suffix} duration={1000} />
              </p>
              <p className="text-xs text-muted-foreground">{formatUsd(s.value * usdRate)}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-muted-foreground">Time Left</p>
            <p className="text-sm font-mono font-medium">{stream.timeRemaining}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Daily Rate</p>
            <p className="text-sm font-mono font-medium">
              <AnimatedNumber value={dailyRate} decimals={tokenType === 'STX' ? 4 : 6} suffix={` ${tokenSymbol}`} duration={1000} />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
