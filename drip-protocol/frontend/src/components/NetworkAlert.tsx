import { Info, AlertCircle, ExternalLink } from "lucide-react";
import { NETWORK_STRING, TESTNET_FAUCET_URL } from "@/lib/stacks";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface NetworkAlertProps {
  className?: string;
  compact?: boolean;
}

export function NetworkAlert({ className, compact = false }: NetworkAlertProps) {
  const isTestnet = NETWORK_STRING === 'testnet';
  
  if (!isTestnet) {
    // Mainnet - show important warning
    return (
      <div className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3",
        compact && "py-2",
        className
      )}>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p className="text-sm font-medium text-destructive">Mainnet Network</p>
            <p className="text-xs text-muted-foreground">Connect your wallet to Mainnet</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Testnet - show informational message
  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3",
      compact && "py-2",
      className
    )}>
      <div className="flex items-center gap-3">
        <Info className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <p className="text-sm font-medium">Testnet Mode</p>
          <p className="text-xs text-muted-foreground">Using Stacks Testnet</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        asChild
        className="text-xs h-8 flex-shrink-0"
      >
        <a 
          href={TESTNET_FAUCET_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="gap-1.5"
        >
          Get Testnet STX
          <ExternalLink className="h-3 w-3" />
        </a>
      </Button>
    </div>
  );
}
