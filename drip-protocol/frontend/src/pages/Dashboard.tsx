import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { StatsCardsSkeleton } from "@/components/dashboard/StatsCardsSkeleton";
import { StreamCard } from "@/components/StreamCard";
import { StreamCardSkeleton } from "@/components/StreamCardSkeleton";
import { Button } from "@/components/ui/button";
import { Plus, Droplets, Wallet } from "lucide-react";
import { useStreams } from "@/hooks/use-streams";
import { useWallet } from "@/contexts/WalletContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { connected, connectWallet, shortAddress } = useWallet();
  const { streams, isLoading } = useStreams();
  
  const outgoing = streams.outgoing;
  const incoming = streams.incoming;

  // Show connect prompt if not connected
  if (!connected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            Connect your Stacks wallet to view your payment streams and start streaming sBTC.
          </p>
          <Button onClick={connectWallet} size="lg" className="gradient-primary">
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, {shortAddress || "Builder"} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's an overview of your payment streams.</p>
        </div>

        {isLoading ? <StatsCardsSkeleton /> : <StatsCards />}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Outgoing Streams</h2>
            <Button size="sm" asChild>
              <Link to="/create"><Plus className="h-4 w-4 mr-1" />Create Stream</Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <StreamCardSkeleton key={i} />)}
            </div>
          ) : outgoing.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outgoing.map((s) => <StreamCard key={`${s.tokenType}-${s.id}`} stream={s} />)}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Incoming Streams</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((i) => <StreamCardSkeleton key={i} />)}
            </div>
          ) : incoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incoming.map((s) => <StreamCard key={`${s.tokenType}-${s.id}`} stream={s} />)}
            </div>
          ) : (
            <EmptyState type="incoming" />
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ type = "outgoing" }: { type?: "outgoing" | "incoming" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gradient-card rounded-lg border border-border/50">
      <Droplets className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-base font-semibold mb-1">No {type} streams yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        {type === "outgoing" 
          ? "Create your first payment stream to start sending sBTC."
          : "You don't have any incoming streams. Share your address to receive sBTC."}
      </p>
      {type === "outgoing" && (
        <Button size="sm" className="mt-5" asChild>
          <Link to="/create"><Plus className="h-4 w-4 mr-1" />Create your first stream</Link>
        </Button>
      )}
    </div>
  );
}
