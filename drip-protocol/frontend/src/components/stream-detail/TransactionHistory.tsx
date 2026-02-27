import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Info } from "lucide-react";
import { getExplorerAddressUrl, DRIP_CONTRACT, fromSmallestUnit } from "@/lib/stacks";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { StreamWithMeta } from "@/hooks/use-streams";

const typeConfig: Record<string, { label: string; className: string }> = {
  created: { label: "Created", className: "bg-primary/20 text-primary border-primary/30" },
  withdrawn: { label: "Withdrawn", className: "bg-accent/20 text-accent border-accent/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

interface Props {
  streamId: string;
  stream?: StreamWithMeta | null;
}

export function TransactionHistory({ streamId, stream }: Props) {
  // For now, show a simplified view based on stream state
  // Full transaction history would require an indexer or querying contract events
  const contractUrl = getExplorerAddressUrl(DRIP_CONTRACT);
  
  const tokenType = stream?.tokenType || 'sBTC';
  const tokenSymbol = tokenType === 'STX' ? 'STX' : 'sBTC';
  const decimals = tokenType === 'STX' ? 4 : 4;
  
  const formatAmount = (amount: bigint) => {
    return `${fromSmallestUnit(amount, tokenType).toFixed(decimals)} ${tokenSymbol}`;
  };

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Transaction History</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px]">
                Transaction history is derived from on-chain stream state. View the contract directly for full details.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {!stream ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading stream data...</p>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Block</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Stream creation event */}
                <TableRow>
                  <TableCell>
                    <Badge variant="outline" className={typeConfig.created.className}>
                      {typeConfig.created.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{formatAmount(stream.totalAmount)}</TableCell>
                  <TableCell className="text-muted-foreground">#{stream.startBlock.toLocaleString()}</TableCell>
                </TableRow>

                {/* Show withdrawn amount if any */}
                {stream.withdrawn > 0n && (
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline" className={typeConfig.withdrawn.className}>
                        {typeConfig.withdrawn.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{formatAmount(stream.withdrawn)}</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                  </TableRow>
                )}

                {/* Show cancelled if stream is inactive before end block */}
                {!stream.active && (
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline" className={typeConfig.cancelled.className}>
                        {typeConfig.cancelled.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">—</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="text-center pt-2">
              <a
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                View contract on explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
