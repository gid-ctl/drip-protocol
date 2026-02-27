import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NetworkAlert } from "@/components/NetworkAlert";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StepIndicator } from "@/components/create-stream/StepIndicator";
import { StepRecipient } from "@/components/create-stream/StepRecipient";
import { StepAmount } from "@/components/create-stream/StepAmount";
import { StepDuration } from "@/components/create-stream/StepDuration";
import { StepReview } from "@/components/create-stream/StepReview";
import { StepSuccess } from "@/components/create-stream/StepSuccess";
import { createStreamSchema, recipientSchema, amountSchema, durationSchema, tokenSchema, type CreateStreamFormValues } from "@/lib/create-stream-schema";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Wallet } from "lucide-react";
import { Confetti } from "@/components/Confetti";
import { useWallet } from "@/contexts/WalletContext";
import { WalletButton } from "@/components/WalletButton";
import { useCreateStream } from "@/hooks/use-streams";
import { explorerTxUrl, toSmallestUnit, daysToBlocks, addRecentRecipient, TOKEN_CONFIG } from "@/lib/stacks";

const stepVariants = {
  enter: (direction: number) => ({ x: direction * 50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -50, opacity: 0 }),
};

// Token + amount validation happens together in step 2
const stepSchemas = [recipientSchema, tokenSchema.merge(amountSchema), durationSchema];

export default function CreateStream() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stepError, setStepError] = useState("");
  const [txId, setTxId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { connected } = useWallet();
  const createStream = useCreateStream();

  const form = useForm<CreateStreamFormValues>({
    resolver: zodResolver(createStreamSchema),
    defaultValues: { 
      recipientAddress: "", 
      tokenType: "STX", // Default to STX since users may not have sBTC
      amount: "" as unknown as number, // Empty string prevents controlled/uncontrolled warning
      durationDays: "" as unknown as number 
    },
    mode: "onTouched",
  });

  const goNext = async () => {
    const schema = stepSchemas[step - 1];
    const values = form.getValues();
    const result = schema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        form.setError(issue.path[0] as keyof CreateStreamFormValues, { message: issue.message });
      });
      setStepError("Please fix the errors below before continuing.");
      return;
    }
    setStepError("");
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  };

  const onSubmit = async () => {
    const values = form.getValues();
    const tokenType = values.tokenType || "STX";
    const tokenSymbol = TOKEN_CONFIG[tokenType].symbol;
    
    try {
      const result = await createStream.mutateAsync({
        recipient: values.recipientAddress,
        amount: toSmallestUnit(values.amount, tokenType),
        durationBlocks: daysToBlocks(values.durationDays),
        tokenType,
      });
      
      // Save recipient to recent list
      addRecentRecipient(values.recipientAddress);
      
      setTxId(result.txId);
      toast({ 
        title: "Stream Created! 🎉", 
        description: (
          <span>
            {values.amount} {tokenSymbol} stream submitted.{" "}
            <a href={explorerTxUrl(result.txId)} target="_blank" rel="noopener noreferrer" className="underline">
              View on Explorer
            </a>
          </span>
        )
      });
      setShowConfetti(true);
      setDirection(1);
      setStep(5);
    } catch (err: any) {
      toast({ 
        title: "Failed to Create Stream", 
        description: err?.message || "Transaction was rejected or failed",
        variant: "destructive"
      });
    }
  };

  const stepContent = () => {
    switch (step) {
      case 1: return <StepRecipient form={form} />;
      case 2: return <StepAmount form={form} />;
      case 3: return <StepDuration form={form} />;
      case 4: return <StepReview form={form} isSubmitting={createStream.isPending} onConfirmSubmit={form.handleSubmit(onSubmit)} />;
      case 5: return <StepSuccess form={form} txId={txId} />;
    }
  };

  if (!connected) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto space-y-6">
          <NetworkAlert compact />
          <Card className="gradient-card border-border/50">
            <CardContent className="p-10 flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                You need to connect a wallet before creating a payment stream.
              </p>
              <WalletButton />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      <div className="max-w-lg mx-auto">
        {step < 5 && <StepIndicator currentStep={step} />}

        <Card className="gradient-card border-border/50">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div aria-live="assertive" className="sr-only">
                  {stepError}
                </div>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    {stepContent()}
                  </motion.div>
                </AnimatePresence>

                {step < 4 && step < 5 && (
                  <div className="flex items-center justify-between mt-8">
                    <Button type="button" variant="ghost" onClick={() => { setDirection(-1); setStep((s) => Math.max(s - 1, 1)); }} disabled={step === 1}>
                      <ArrowLeft className="h-4 w-4 mr-1" />Back
                    </Button>
                    <Button type="button" onClick={goNext}>
                      Continue<ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
