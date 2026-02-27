import { useState } from "react";
import { useTheme } from "next-themes";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Copy, LogOut, Bell, BellOff, Sun, Moon, Monitor, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { TESTNET_FAUCET_URL, getExplorerAddressUrl } from "@/lib/stacks";

export default function Settings() {
  const { connected, address, sbtcBalanceFormatted, stxBalanceFormatted, disconnectWallet } = useWallet();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const [notifications, setNotifications] = useState({
    streamCompleted: true,
    withdrawalReceived: true,
    streamCancelled: true,
    lowBalance: false,
  });

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast({ title: "Address copied" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const notificationItems = [
    { key: "streamCompleted" as const, label: "Stream Completed", description: "Notify when a stream finishes" },
    { key: "withdrawalReceived" as const, label: "Withdrawal Received", description: "Notify on incoming withdrawals" },
    { key: "streamCancelled" as const, label: "Stream Cancelled", description: "Notify when a stream is cancelled" },
    { key: "lowBalance" as const, label: "Low Balance Alert", description: "Warn when wallet balance is low" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your wallet, notifications, and preferences.</p>
        </div>

        {/* Wallet Management */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet Management
            </CardTitle>
            <CardDescription>View and manage your connected wallet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connected ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Connected Wallet</p>
                    <p className="font-mono text-sm">{address}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopy} aria-label="Copy wallet address">
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">sBTC Balance</p>
                    <p className="text-sm font-mono">{sbtcBalanceFormatted.toFixed(8)} sBTC</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">STX Balance</p>
                    <p className="text-sm font-mono">{stxBalanceFormatted.toFixed(2)} STX</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a href={address ? getExplorerAddressUrl(address) : "#"} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      View on Explorer
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a href={TESTNET_FAUCET_URL} target="_blank" rel="noopener noreferrer">
                      Get Testnet STX
                    </a>
                  </Button>
                </div>
                <Button variant="destructive" size="sm" onClick={disconnectWallet} className="w-full">
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Disconnect Wallet
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No wallet connected. Connect a wallet from the navigation bar.</p>
            )}
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose which notifications you'd like to receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={item.key} className="text-sm font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  id={item.key}
                  checked={notifications[item.key]}
                  onCheckedChange={() => toggleNotification(item.key)}
                  aria-label={`Toggle ${item.label}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Theme Settings
            </CardTitle>
            <CardDescription>Select your preferred appearance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                    theme === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={`Set theme to ${opt.label}`}
                  aria-pressed={theme === opt.value}
                >
                  <opt.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
