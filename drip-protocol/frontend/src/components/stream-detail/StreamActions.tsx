import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCancelStream, useWithdraw, type StreamWithMeta } from "@/hooks/use-streams";
import { usePrices } from "@/hooks/use-prices";
import { fromSmallestUnit, explorerTxUrl } from "@/lib/stacks";
import { Loader2 } from "lucide-react";

interface Props {
  stream: StreamWithMeta;
}

export function StreamActions({ stream }: Props) {
  const { toast } = useToast();
  const cancelStream = useCancelStream();
  const withdraw = useWithdraw();
  const { stxPrice, sbtcPrice } = usePrices();
  
  const tokenType = stream.tokenType || 'sBTC';
  const tokenSymbol = tokenType === 'STX' ? 'STX' : 'sBTC';
  const usdRate = tokenType === 'STX' ? stxPrice : sbtcPrice;
  const decimals = tokenType === 'STX' ? 4 : 4;
  
  const withdrawableAmount = fromSmallestUnit(stream.withdrawableAmount, tokenType);
  const isOutgoing = stream.direction === "outgoing";

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
            {withdrawableAmount.toFixed(decimals)} {tokenSymbol} withdrawal is processing.{" "}
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

  const handleCancel = async () => {
    try {
      const result = await cancelStream.mutateAsync({
        streamId: stream.id,
        expectedRefund: stream.remainingAmount,
        tokenType: stream.tokenType,
      });
      toast({ 
        title: "Cancel Submitted", 
        description: (
          <span>
            Stream cancellation is processing.{" "}
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

  if (stream.status !== "active") return null;

  return (
    <div className="flex flex-col gap-3">
      {!isOutgoing && withdrawableAmount > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" disabled={withdraw.isPending}>
              {withdraw.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
              ) : (
                `Withdraw ${withdrawableAmount.toFixed(decimals)} ${tokenSymbol} (≈ $${(withdrawableAmount * usdRate).toLocaleString("en-US", { maximumFractionDigits: 0 })})`
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
              <AlertDialogDescription>
                You will withdraw {withdrawableAmount.toFixed(decimals)} {tokenSymbol} (≈ ${(withdrawableAmount * usdRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}) from this stream. This action will submit a transaction to the Stacks network.
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

      {isOutgoing && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={cancelStream.isPending}>
              {cancelStream.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
              ) : (
                "Cancel Stream"
              )}
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
    </div>
  );
}
