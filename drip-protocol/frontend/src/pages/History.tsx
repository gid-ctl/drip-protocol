import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StreamCard } from "@/components/StreamCard";
import { StreamCardSkeleton } from "@/components/StreamCardSkeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStreams, type StreamWithMeta } from "@/hooks/use-streams";
import { useWallet } from "@/contexts/WalletContext";
import { formatAddress, satsToSbtc } from "@/lib/stacks";
import { Search, Droplets, LayoutGrid, List, Wallet } from "lucide-react";

type SortKey = "newest" | "oldest" | "highest";
type ViewMode = "streams" | "transactions";

export default function History() {
  const { connected, connectWallet } = useWallet();
  const { streams, isLoading } = useStreams();
  const [view, setView] = useState<ViewMode>("streams");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  // Combine outgoing and incoming streams
  const allStreams = useMemo(() => {
    return [...streams.outgoing, ...streams.incoming];
  }, [streams.outgoing, streams.incoming]);

  // Streams filtering
  const filtered = useMemo(() => {
    let result = allStreams;
    if (tab === "completed") result = result.filter((s) => s.status === "completed");
    else if (tab === "cancelled") result = result.filter((s) => s.status === "cancelled");
    else if (tab === "active") result = result.filter((s) => s.status === "active");

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.sender.toLowerCase().includes(q) || s.recipient.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sort === "oldest") return a.startBlock - b.startBlock;
      if (sort === "highest") return Number(b.totalAmount - a.totalAmount);
      return b.startBlock - a.startBlock; // newest first
    });
  }, [allStreams, tab, search, sort]);

  const counts = {
    all: allStreams.length,
    active: allStreams.filter((s) => s.status === "active").length,
    completed: allStreams.filter((s) => s.status === "completed").length,
    cancelled: allStreams.filter((s) => s.status === "cancelled").length,
  };

  if (!connected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            Connect your Stacks wallet to view your stream history.
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
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">History</h1>
            <p className="text-muted-foreground text-sm mt-1">View and filter all your payment streams.</p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-md border border-border p-1">
            <Button
              variant={view === "streams" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setView("streams")}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Streams
            </Button>
            <Button
              variant={view === "transactions" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setView("transactions")}
            >
              <List className="h-4 w-4 mr-1.5" />
              Transactions
            </Button>
          </div>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* === STREAMS VIEW === */}
        {view === "streams" && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex w-full overflow-x-auto scrollbar-hide sm:inline-flex sm:w-auto">
              <TabsTrigger value="all" className="flex-shrink-0 px-2 sm:px-3">All <Badge variant="secondary" className="ml-1.5 text-xs hidden sm:inline-flex">{counts.all}</Badge></TabsTrigger>
              <TabsTrigger value="active" className="flex-shrink-0 px-2 sm:px-3">Active <Badge variant="secondary" className="ml-1.5 text-xs hidden sm:inline-flex">{counts.active}</Badge></TabsTrigger>
              <TabsTrigger value="completed" className="flex-shrink-0 px-2 sm:px-3">Completed <Badge variant="secondary" className="ml-1.5 text-xs hidden sm:inline-flex">{counts.completed}</Badge></TabsTrigger>
              <TabsTrigger value="cancelled" className="flex-shrink-0 px-2 sm:px-3">Cancelled <Badge variant="secondary" className="ml-1.5 text-xs hidden sm:inline-flex">{counts.cancelled}</Badge></TabsTrigger>
            </TabsList>

            {["all", "active", "completed", "cancelled"].map((t) => (
              <TabsContent key={t} value={t}>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {[1, 2, 3].map((i) => <StreamCardSkeleton key={i} />)}
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {filtered.map((s) => <StreamCard key={`${s.tokenType}-${s.id}`} stream={s} />)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center gradient-card rounded-lg border border-border/50 mt-4">
                    <Droplets className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base font-semibold mb-1">No streams found</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      {allStreams.length === 0 
                        ? "You don't have any streams yet. Create one to get started!"
                        : "Try adjusting your search or filter to find what you're looking for."}
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* === TRANSACTIONS VIEW === */}
        {view === "transactions" && (
          <div className="flex flex-col items-center justify-center py-16 text-center gradient-card rounded-lg border border-border/50">
            <Droplets className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold mb-1">Transaction History Coming Soon</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Transaction history will be available once you start using streams on testnet.
              View your streams in the Streams tab above.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
