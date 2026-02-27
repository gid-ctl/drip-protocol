import { UseFormReturn } from "react-hook-form";
import { CreateStreamFormValues } from "@/lib/create-stream-schema";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const BLOCKS_PER_DAY = 144;
const presets = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1yr", days: 365 },
];

interface Props {
  form: UseFormReturn<CreateStreamFormValues>;
}

export function StepDuration({ form }: Props) {
  const days = form.watch("durationDays");
  const amount = form.watch("amount");
  const blocks = days ? days * BLOCKS_PER_DAY : 0;
  const dailyRate = days && amount ? amount / days : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Stream Duration</h3>
        <p className="text-sm text-muted-foreground">How long should the stream run?</p>
      </div>

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
        {presets.map((p) => (
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

      {days > 0 && (
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
          <div>
            <p className="text-xs text-muted-foreground">Block Height Duration</p>
            <p className="text-sm font-mono font-medium">{blocks.toLocaleString()} blocks</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Streaming Rate</p>
            <p className="text-sm font-mono font-medium">{dailyRate.toFixed(6)} sBTC/day</p>
          </div>
        </div>
      )}
    </div>
  );
}
