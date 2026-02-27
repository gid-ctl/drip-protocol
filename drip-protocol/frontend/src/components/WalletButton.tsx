import { useState } from "react";
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink, RefreshCw, Loader2, Network } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getExplorerAddressUrl, NETWORK_STRING } from "@/lib/stacks";

export function WalletButton() {
  const { 
    connected, 
    address, 
    shortAddress,
    sbtcBalanceFormatted,
    stxBalanceFormatted,
    isLoading,
    error,
    connectWallet, 
    disconnectWallet,
    refreshBalances,
    faucetUrl,
  } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setIsRefreshing(false);
  };

  const handleViewExplorer = () => {
    if (address) {
      window.open(getExplorerAddressUrl(address), '_blank');
    }
  };

  const handleOpenFaucet = () => {
    window.open(faucetUrl, '_blank');
  };

  if (connected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-foreground">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-xs">{shortAddress}</span>
            <span className="text-xs text-muted-foreground">{sbtcBalanceFormatted.toFixed(6)} sBTC</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
            <Network className="h-3 w-3" />
            <span className="uppercase">{NETWORK_STRING}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-2 text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted-foreground">STX Balance</span>
              <span className="font-mono">{stxBalanceFormatted.toFixed(2)} STX</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">sBTC Balance</span>
              <span className="font-mono">{sbtcBalanceFormatted.toFixed(8)} sBTC</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopy} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Address"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRefresh} className="gap-2" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Balances
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewExplorer} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View in Explorer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenFaucet} className="gap-2">
            <Wallet className="h-4 w-4" />
            Get Testnet STX
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnectWallet} className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      onClick={connectWallet} 
      disabled={isLoading}
      className="gap-2 gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
