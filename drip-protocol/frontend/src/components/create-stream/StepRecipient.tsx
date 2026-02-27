import { useState, useEffect, useRef, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateStreamFormValues } from "@/lib/create-stream-schema";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Clipboard, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { formatAddress, resolveBns, reverseBns, getRecentRecipients, type RecentRecipient } from "@/lib/stacks";

interface Props {
  form: UseFormReturn<CreateStreamFormValues>;
}

export function StepRecipient({ form }: Props) {
  const [bnsInput, setBnsInput] = useState("");
  const [bnsStatus, setBnsStatus] = useState<"idle" | "loading" | "resolved" | "not_found">("idle");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent recipients from localStorage
  useEffect(() => {
    setRecentRecipients(getRecentRecipients());
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      form.setValue("recipientAddress", text, { shouldValidate: true });
      setBnsInput("");
      setBnsStatus("idle");
      setResolvedAddress(null);
    } catch { /* clipboard denied */ }
  };

  const lookupBns = useCallback(async (name: string) => {
    setBnsStatus("loading");
    const address = await resolveBns(name);
    if (address) {
      setBnsStatus("resolved");
      setResolvedAddress(address);
      form.setValue("recipientAddress", address, { shouldValidate: true });
      form.clearErrors("recipientAddress");
    } else {
      setBnsStatus("not_found");
      setResolvedAddress(null);
    }
  }, [form]);

  const handleInputChange = useCallback((value: string) => {
    // Track the raw input for BNS display
    if (value.endsWith(".btc")) {
      setBnsInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => lookupBns(value), 300);
    } else {
      setBnsInput("");
      setBnsStatus("idle");
      setResolvedAddress(null);
    }
  }, [lookupBns]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const selectRecipient = async (address: string) => {
    form.setValue("recipientAddress", address, { shouldValidate: true });
    setRecentOpen(false);
    
    // Try to resolve BNS name for this address (optional enhancement)
    const bnsName = await reverseBns(address);
    if (bnsName) {
      setBnsInput(bnsName);
      setBnsStatus("resolved");
      setResolvedAddress(address);
    } else {
      setBnsInput("");
      setBnsStatus("idle");
      setResolvedAddress(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Recipient Address</h3>
        <p className="text-sm text-muted-foreground">Enter the Stacks address or BNS name that will receive the stream.</p>
      </div>

      <FormField
        control={form.control}
        name="recipientAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              Stacks Address
              {/^SP[A-Z0-9]{38,}$/.test(form.watch("recipientAddress") || "") && (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary animate-in fade-in" />
              )}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="SP... or name.btc"
                  className="pr-10 font-mono"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleInputChange(e.target.value);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handlePaste}
                >
                  <Clipboard className="h-3.5 w-3.5" />
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* BNS resolution status */}
      {bnsStatus === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Resolving {bnsInput}...</span>
        </div>
      )}
      {bnsStatus === "resolved" && resolvedAddress && (
        <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-normal">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          {bnsInput} → {formatAddress(resolvedAddress)}
        </Badge>
      )}
      {bnsStatus === "not_found" && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-3.5 w-3.5" />
          <span>Name not found</span>
        </div>
      )}

      {/* Recent recipients dropdown */}
      {recentRecipients.length > 0 && (
        <Popover open={recentOpen} onOpenChange={setRecentOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Clock className="h-3.5 w-3.5" />
              Recent Recipients
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search recipients..." />
              <CommandList>
                <CommandEmpty>No recipients found.</CommandEmpty>
                <CommandGroup>
                  {recentRecipients.map((r) => (
                    <CommandItem
                      key={r.address}
                      value={`${r.label} ${r.address}`}
                      onSelect={() => selectRecipient(r.address)}
                      className="flex flex-col items-start gap-0.5 cursor-pointer"
                    >
                      <span className="text-sm font-medium">{r.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">{formatAddress(r.address)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
