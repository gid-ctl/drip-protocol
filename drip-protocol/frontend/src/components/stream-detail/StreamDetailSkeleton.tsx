import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StreamDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-6 w-48" />
      {/* Progress */}
      <Card className="gradient-card border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-28" /></div>
          <Skeleton className="h-4 w-full rounded-full" />
          <div className="flex justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" /></div>
        </CardContent>
      </Card>
      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="gradient-card border-border/50"><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent className="space-y-3">{[1,2,3,4].map(i=><Skeleton key={i} className="h-4 w-full" />)}</CardContent></Card>
          <Card className="gradient-card border-border/50"><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">{[1,2,3,4,5,6].map(i=><div key={i}><Skeleton className="h-3 w-16 mb-1" /><Skeleton className="h-4 w-24" /></div>)}</div></CardContent></Card>
        </div>
        <div className="space-y-6">
          <Card className="gradient-card border-border/50"><CardHeader><Skeleton className="h-5 w-20" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-10 w-full rounded-md" /><Skeleton className="h-10 w-full rounded-md" /></CardContent></Card>
          <Card className="gradient-card border-border/50"><CardHeader><Skeleton className="h-5 w-28" /></CardHeader><CardContent className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        </div>
      </div>
    </div>
  );
}
