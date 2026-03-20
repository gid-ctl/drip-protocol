import { UseFormReturn } from "react-hook-form";
import { CreateStreamFormValues } from "@/lib/create-stream-schema";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap } from "lucide-react";

const BLOCKS_PER_DAY = 144;

const dayPresets = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1yr", days: 365 },
];

const demoPresets = [
  { label: "5 blocks", blocks: 5 },
  { label: "10 blocks", blocks: 10 },
  { label: "20 blocks", blocks: 20 },
  { label: "50 blocks", blocks: 50 },
  { label: "100 blocks", blocks: 100 },
];

interface Props {
  form: UseFormReturn<CreateStreamFormValues>;
}

export function StepDuration({ form }: Props) {
  const mode = form.watch("durationMode") || "days";
  const days = form.watch("durationDays");
  const blocks = form.watch("durationBlocks");
  const amount = form.watch("amount");

  const isDemo = mode === "blocks";
  const effectiveBlocks = isDemo ? (blocks || 0) : (days ? days * BLOCKS_PER_DAY : 0);
  const dailyRate = days && amount && mode === "days" ? amount / days : 0;

  const switchMode = (newMode: "days" | "blocks") => {
    form.setValue("durationMode", newMode, { shouldValidate: true });
    if (newMode === "blocks") {
      form.setValue("durationDays", undefined, { shouldValidate: false });
      if (!blocks) form.setValue("durationBlocks", 10, { shouldValidate: true });
    } else {
      form.setValue("durationBlocks", undefined, { shouldValidate: false });
      if (!days) form.setValue("durationDays", 30, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Stream Duration</h3>
        <p className="text-sm text-muted-foreground">How long should the stream run?</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!isDemo ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("days")}
        >
          Days
        </Button>
        <Button
          type="button"
          variant={isDemo ? "default" : "outline"}
          size="sm"
          className={isDemo ? "bg-amber-500 hover:bg-amber-600" : ""}
          onClick={() => switchMode("blocks")}
        >
          <Zap className="h-3.5 w-3.5 mr-1" />
          Demo (Blocks)
        </Button>
      </div>

      {isDemo ? (
        <>
          {/* Block-based input for demos */}
          <FormField
            control={form.control}
            name="durationBlocks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  Duration (blocks)
                  {typeof blocks === "number" && blocks >= 1 && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 animate-in fade-in" />
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="10"
                    className="font-mono text-lg"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap gap-2">
            {demoPresets.map((p) => (
              <Button
                key={p.label}
                type="button"
                variant="outline"
                size="sm"
                className={blocks === p.blocks ? "border-amber-500 text-amber-500" : ""}
                onClick={() => form.setValue("durationBlocks", p.blocks, { shouldValidate: true })}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {(blocks || 0) > 0 && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-500">Demo Mode</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Blocks</p>
                  <p className="text-sm font-mono font-medium">{effectiveBlocks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Est. Time</p>
                  <p className="text-sm font-mono font-medium">
                    ~{effectiveBlocks <= 10 ? `${effectiveBlocks * 10} sec` : `${Math.ceil(effectiveBlocks / 6)} min`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Day-based input (original) */}
          <FormField
            control={form.control}
            name="durationDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  Duration (days)
                  {typeof days === "number" && days >= 1 && days <= 365 && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary animate-in fade-in" />
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    className="font-mono text-lg"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap gap-2">
            {dayPresets.map((p) => (
              <Button
                key={p.label}
                type="button"
                variant="outline"
                size="sm"
                className={days === p.days ? "border-primary text-primary" : ""}
                onClick={() => form.setValue("durationDays", p.days, { shouldValidate: true })}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {(days || 0) > 0 && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
              <div>
                <p className="text-xs text-muted-foreground">Block Height Duration</p>
                <p className="text-sm font-mono font-medium">{effectiveBlocks.toLocaleString()} blocks</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Streaming Rate</p>
                <p className="text-sm font-mono font-medium">{dailyRate.toFixed(6)} /day</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
