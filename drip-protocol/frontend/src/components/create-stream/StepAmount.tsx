import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateStreamFormValues, TokenTypeValue } from "@/lib/create-stream-schema";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { usePrices } from "@/hooks/use-prices";
import { TOKEN_CONFIG } from "@/lib/stacks";
import { cn } from "@/lib/utils";

interface Props {
  form: UseFormReturn<CreateStreamFormValues>;
}

export function StepAmount({ form }: Props) {
  const { sbtcBalanceFormatted, stxBalanceFormatted } = useWallet();
  const { stxPrice, sbtcPrice } = usePrices();
  const tokenType = form.watch("tokenType") || "STX";
  
  // Get balance based on token type
  const balance = tokenType === "STX" ? stxBalanceFormatted : sbtcBalanceFormatted;
  const tokenConfig = TOKEN_CONFIG[tokenType as TokenTypeValue];
  const amount = form.watch("amount");
  const exceedsBalance = typeof amount === "number" && amount > balance;

  useEffect(() => {
    if (exceedsBalance) {
      form.setError("amount", { message: `Amount exceeds your balance of ${balance.toFixed(4)} ${tokenConfig.symbol}` });
    } else if (typeof amount === "number" && amount > 0) {
      form.clearErrors("amount");
    }
  }, [amount, balance, exceedsBalance, form, tokenConfig.symbol]);

  // Calculate USD value with real prices
  const usdRate = tokenType === "STX" ? stxPrice : sbtcPrice;
  const usdValue = amount ? (amount * usdRate).toLocaleString("en-US", { style: "currency", currency: "USD" }) : "$0.00";

  const setPercent = (pct: number) => {
    const decimals = tokenType === "STX" ? 6 : 8;
    const val = parseFloat((balance * pct).toFixed(decimals));
    form.setValue("amount", val, { shouldValidate: true });
  };

  const handleTokenChange = (newToken: TokenTypeValue) => {
    form.setValue("tokenType", newToken);
    // Reset amount when switching tokens
    form.setValue("amount", 0, { shouldValidate: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Stream Amount</h3>
        <p className="text-sm text-muted-foreground">Choose your token and amount to stream.</p>
      </div>

      {/* Token Selection */}
      <div className="space-y-2">
        <FormLabel>Token</FormLabel>
        <div className="grid grid-cols-2 gap-3">
          {(["STX", "sBTC"] as TokenTypeValue[]).map((token) => {
            const config = TOKEN_CONFIG[token];
            const tokenBalance = token === "STX" ? stxBalanceFormatted : sbtcBalanceFormatted;
            const isSelected = tokenType === token;
            
            return (
              <button
                key={token}
                type="button"
                onClick={() => handleTokenChange(token)}
                className={cn(
                  "flex flex-col items-center gap-1 p-4 rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <span className="text-2xl">{config.icon}</span>
                <span className="font-semibold">{config.symbol}</span>
                <span className="text-xs text-muted-foreground">
                  Balance: {tokenBalance.toFixed(token === "STX" ? 2 : 4)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              Amount ({tokenConfig.symbol})
              {typeof amount === "number" && amount > 0 && !exceedsBalance && (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary animate-in fade-in" />
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                step="any"
                placeholder="0.0000"
                className="font-mono text-lg"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : "")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">≈ {usdValue}</span>
        <span className="text-muted-foreground">
          Balance: <span className="font-mono text-foreground">{balance.toFixed(tokenType === "STX" ? 2 : 4)} {tokenConfig.symbol}</span>
        </span>
      </div>

      <div className="flex gap-2">
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <Button key={pct} type="button" variant="outline" size="sm" className="flex-1" onClick={() => setPercent(pct)}>
            {pct === 1 ? "MAX" : `${pct * 100}%`}
          </Button>
        ))}
      </div>

      {exceedsBalance && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Amount exceeds your available balance of {balance.toFixed(tokenType === "STX" ? 2 : 4)} {tokenConfig.symbol}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
