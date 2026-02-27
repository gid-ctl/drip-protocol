import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowUpRight, ArrowDownLeft, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCancelStream, useWithdraw, type StreamWithMeta } from "@/hooks/use-streams";
import { usePrices } from "@/hooks/use-prices";
import { fromSmallestUnit, formatAddress, explorerTxUrl } from "@/lib/stacks";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  completed: { label: "Completed", className: "bg-success/20 text-success border-success/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

// Fallback status config
const defaultStatus = { label: "Unknown", className: "bg-muted/20 text-muted-foreground border-muted" };

interface Props {
  stream: StreamWithMeta;
}

export function StreamCard({ stream }: Props) {
  const { toast } = useToast();
  const cancelStream = useCancelStream();
  const withdraw = useWithdraw();
  const { stxPrice, sbtcPrice } = usePrices();
  
  const tokenType = stream.tokenType || 'sBTC';
  const tokenSymbol = tokenType === 'STX' ? 'STX' : 'sBTC';
  const usdRate = tokenType === 'STX' ? stxPrice : sbtcPrice;
  const decimals = tokenType === 'STX' ? 4 : 4;
  
  const progress = stream.progressPercent;
  const vestedAmount = fromSmallestUnit(stream.vested, tokenType);
  const withdrawableAmount = fromSmallestUnit(stream.withdrawable, tokenType);
  const remainingAmount = fromSmallestUnit(stream.totalAmount - stream.vested, tokenType);
  const totalAmount = fromSmallestUnit(stream.totalAmount, tokenType);
  
  const status = statusConfig[stream.status] || defaultStatus;
  const isOutgoing = stream.direction === "outgoing";
  const counterparty = isOutgoing ? stream.recipient : stream.sender;

  const handleCancel = async () => {
    try {
      const result = await cancelStream.mutateAsync({
        streamId: stream.id,
        expectedRefund: stream.remainingAmount,
        tokenType: stream.tokenType,
      });
      toast({ 
        title: "Cancel Transaction Submitted", 
        description: (
          <span>
            TX submitted.{" "}
            <a href={explorerTxUrl(result.txId)} target="_blank" rel="noopener noreferrer" className="underline">
              View on Explorer
            </a>
          </span>
        )
      });
    } catch (err: any) {
      toast({ 
        title: "Cancel Failed", 
        description: err?.message || "Failed to cancel stream",
        variant: "destructive"
      });
    }
  };

  const handleWithdraw = async () => {
    try {
      const result = await withdraw.mutateAsync({
        streamId: stream.id,
        expectedAmount: stream.withdrawableAmount,
        tokenType: stream.tokenType,
      });
      toast({ 
        title: "Withdrawal Submitted", 
        description: (
          <span>
            {withdrawableAmount.toFixed(decimals)} {tokenSymbol} withdrawal processing.{" "}
            <a href={explorerTxUrl(result.txId)} target="_blank" rel="noopener noreferrer" className="underline">
              View on Explorer
            </a>
          </span>
        )
      });
    } catch (err: any) {
      toast({ 
        title: "Withdrawal Failed", 
        description: err?.message || "Failed to withdraw",
        variant: "destructive"
      });
    }
  };

  return (
    <Card
      className="gradient-card border-border/50 hover:shadow-[0_8px_30px_hsl(36_100%_50%/0.08)] hover:-translate-y-0.5 transition-all duration-300 group"
      aria-label={`${isOutgoing ? "Outgoing" : "Incoming"} stream of ${totalAmount.toFixed(decimals)} ${tokenSymbol}, ${stream.status}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isOutgoing ? "bg-primary/10" : "bg-accent/10"}`}>
              {isOutgoing ? (
                <ArrowUpRight className="h-4 w-4 text-primary" />
              ) : (
                <ArrowDownLeft className="h-4 w-4 text-accent" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{isOutgoing ? "To" : "From"}</p>
              <p className="text-xs text-muted-foreground font-mono">{formatAddress(counterparty)}</p>
            </div>
          </div>
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
        </div>

        <div
          className="relative h-2 w-full rounded-full bg-secondary overflow-hidden mb-3"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Stream progress: ${progress.toFixed(1)}% vested`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
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

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>{progress.toFixed(1)}% vested</span>
          <span>{stream.timeRemaining}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Vested</p>
            <p className="text-sm font-mono font-medium">{vestedAmount.toFixed(decimals)} {tokenSymbol}</p>
            <p className="text-xs text-muted-foreground">≈ ${(vestedAmount * usdRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-sm font-mono font-medium">{remainingAmount.toFixed(decimals)} {tokenSymbol}</p>
            <p className="text-xs text-muted-foreground">≈ ${(remainingAmount * usdRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/stream/${stream.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              Details
            </Link>
          </Button>
          {stream.status === "active" && isOutgoing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1" disabled={cancelStream.isPending}>
                  {cancelStream.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Stream?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cancelling will return unvested funds to your wallet. Already vested funds remain claimable by the recipient.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Stream</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>
                    Cancel Stream
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {stream.status === "active" && !isOutgoing && withdrawableAmount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="flex-1" disabled={withdraw.isPending}>
                  {withdraw.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Withdraw ${withdrawableAmount.toFixed(decimals)}`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will withdraw {withdrawableAmount.toFixed(decimals)} {tokenSymbol} (≈ ${(withdrawableAmount * usdRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}) from this stream.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleWithdraw}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
