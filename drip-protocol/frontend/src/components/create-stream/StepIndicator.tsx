import { Check } from "lucide-react";

const steps = ["Recipient", "Amount", "Duration", "Review"];

interface Props {
  currentStep: number;
}

export function StepIndicator({ currentStep }: Props) {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-1 sm:gap-0">
        {steps.map((label, i) => {
          const step = i + 1;
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isComplete
                      ? "gradient-primary text-primary-foreground"
                      : isCurrent
                      ? "border-2 border-primary text-primary"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : step}
                </div>
                <span className={`text-[10px] sm:text-xs ${isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-3 ${isComplete ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full gradient-primary transition-all duration-300 ease-out ${
              progress === 100 ? "shadow-[0_0_8px_hsl(var(--primary)/0.4)] animate-pulse" : ""
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
          <span>Step {currentStep} of {steps.length}</span>
          {progress === 100 ? (
            <span className="text-primary font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Complete
            </span>
          ) : (
            <span>{progress}%</span>
          )}
        </div>
      </div>
    </div>
  );
}
