import { Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NETWORK_STRING } from "@/lib/stacks";
import { cn } from "@/lib/utils";

interface NetworkBadgeProps {
  variant?: "default" | "compact";
  className?: string;
}

export function NetworkBadge({ variant = "default", className }: NetworkBadgeProps) {
  const isTestnet = NETWORK_STRING === 'testnet';
  
  return (
    <Badge 
      variant={isTestnet ? "outline" : "default"}
      className={cn(
        "gap-1.5 font-medium",
        isTestnet 
          ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20" 
          : "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20",
        className
      )}
    >
      {variant === "default" && <Network className="h-3 w-3" />}
      <span className="uppercase text-xs font-semibold tracking-wide">
        {isTestnet ? 'Testnet' : 'Mainnet'}
      </span>
    </Badge>
  );
}
