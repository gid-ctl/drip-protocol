import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAddress, fromSmallestUnit, blocksToApproxDays } from "@/lib/stacks";
import type { StreamWithMeta } from "@/hooks/use-streams";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  completed: { label: "Completed", className: "bg-success/20 text-success border-success/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

interface Props {
  stream: StreamWithMeta;
}

export function StreamDetailsCard({ stream }: Props) {
  const status = statusConfig[stream.status];
  const durationBlocks = stream.endBlock - stream.startBlock;
  const durationDays = blocksToApproxDays(durationBlocks);
  const tokenType = stream.tokenType || 'sBTC';
  const tokenSymbol = tokenType === 'STX' ? 'STX' : 'sBTC';
  const decimals = tokenType === 'STX' ? 4 : 4;
  const totalAmount = fromSmallestUnit(stream.totalAmount, tokenType);
  
  const rows = [
    { label: "Sender", value: formatAddress(stream.sender), mono: true },
    { label: "Recipient", value: formatAddress(stream.recipient), mono: true },
    { label: "Total Amount", value: `${totalAmount.toFixed(decimals)} ${tokenSymbol}` },
    { label: "Duration", value: `~${durationDays.toFixed(0)} days (${durationBlocks} blocks)` },
    { label: "Start Block", value: stream.startBlock.toLocaleString() },
    { label: "End Block", value: stream.endBlock.toLocaleString() },
  ];

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Stream Details</CardTitle>
          <Badge variant="outline" className={status.className}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className={r.mono ? "font-mono" : ""}>{r.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
