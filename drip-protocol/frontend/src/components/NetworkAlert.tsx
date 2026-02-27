import { Info, AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NETWORK_STRING, TESTNET_FAUCET_URL } from "@/lib/stacks";
import { Button } from "./ui/button";

interface NetworkAlertProps {
  className?: string;
}

export function NetworkAlert({ className }: NetworkAlertProps) {
  const isTestnet = NETWORK_STRING === 'testnet';
  
  if (!isTestnet) {
    // Mainnet - show important warning
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Mainnet Network Required</AlertTitle>
        <AlertDescription>
          This application is connected to the <strong>Stacks Mainnet</strong>. Make sure your wallet
          is connected to Mainnet before creating or managing streams.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Testnet - show informational message
  return (
    <Alert className={className}>
      <Info className="h-4 w-4" />
      <AlertTitle>Testnet Mode</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          This application is connected to the <strong>Stacks Testnet</strong>. Please connect
          your wallet to Testnet to use this application.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="text-xs"
          >
            <a 
              href={TESTNET_FAUCET_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="gap-1"
            >
              Get Testnet STX
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
