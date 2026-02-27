import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StreamProgress } from "@/components/stream-detail/StreamProgress";
import { StreamDetailsCard } from "@/components/stream-detail/StreamDetailsCard";
import { StreamQuickStats } from "@/components/stream-detail/StreamQuickStats";
import { StreamActions } from "@/components/stream-detail/StreamActions";
import { TransactionHistory } from "@/components/stream-detail/TransactionHistory";
import { StreamDetailSkeleton } from "@/components/stream-detail/StreamDetailSkeleton";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useStream } from "@/hooks/use-streams";
import { ArrowLeft, Droplets, Wallet } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

export default function StreamDetail() {
  const { id } = useParams();
  const { connected, connectWallet } = useWallet();
  const streamId = id ? parseInt(id, 10) : -1;
  const { stream, isLoading, error } = useStream(streamId);

  if (!connected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
          <p className="text-muted-foreground text-sm mb-6">Connect your wallet to view stream details.</p>
          <Button onClick={connectWallet}>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!id || streamId < 0 || isNaN(streamId)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Droplets className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invalid Stream ID</h2>
          <p className="text-muted-foreground text-sm mb-6">Please provide a valid stream ID.</p>
          <Button asChild><Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Back to Dashboard</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <StreamDetailSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !stream) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Droplets className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Stream Not Found</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {error?.message || "The stream you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <Button asChild><Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Back to Dashboard</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Stream #{stream.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-xl font-bold">Stream #{stream.id}</h1>
        <StreamProgress stream={stream} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <StreamDetailsCard stream={stream} />
            <StreamQuickStats stream={stream} />
          </div>
          <div className="space-y-6">
            <StreamActions stream={stream} />
            <TransactionHistory streamId={stream.id} stream={stream} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
