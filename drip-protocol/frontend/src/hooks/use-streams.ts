/**
 * DRIP Protocol - useStreams Hook
 * 
 * React hook for fetching and managing stream data from the drip-core contract.
 * Uses React Query for caching, refetching, and state management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import {
  getAllUserStreams,
  getAllUserStxStreams,
  getFullStreamDetails,
  getFullStxStreamDetails,
  getCurrentBlockHeight,
  type ParsedStream,
  createStream as createStreamTx,
  withdraw as withdrawTx,
  cancelStream as cancelStreamTx,
  trackTransaction,
  type CreateStreamParams,
  type TxInfo,
  STREAM_POLL_INTERVAL,
  satsToSbtc,
  blocksToDays,
  type TokenType,
  TOKEN_CONFIG,
} from "@/lib/stacks";
import { useToast } from "@/hooks/use-toast";

// ============================================
// Types
// ============================================

export type StreamStatus = 'active' | 'completed' | 'cancelled';

export interface StreamWithMeta extends ParsedStream {
  // Computed display values
  direction: "outgoing" | "incoming";
  status: StreamStatus;
  progressPercent: number;
  vestedAmount: bigint;
  withdrawableAmount: bigint;
  remainingAmount: bigint;
  daysRemaining: number;
  daysTotal: number;
  isFullyVested: boolean;
}

export interface StreamsState {
  outgoing: StreamWithMeta[];
  incoming: StreamWithMeta[];
  totalStreaming: bigint;
  totalReceived: bigint;
  activeOutgoingCount: number;
  activeIncomingCount: number;
}

// ============================================
// Query Keys
// ============================================

export const streamQueryKeys = {
  all: ["streams"] as const,
  userStreams: (address: string) => [...streamQueryKeys.all, "user", address] as const,
  stream: (id: number) => [...streamQueryKeys.all, "detail", id] as const,
  blockHeight: ["blockHeight"] as const,
};

// ============================================
// Hooks
// ============================================

/**
 * Hook to get current block height
 */
export function useBlockHeight() {
  return useQuery({
    queryKey: streamQueryKeys.blockHeight,
    queryFn: getCurrentBlockHeight,
    refetchInterval: 60000, // Refresh every 60 seconds
    staleTime: 30000, // Consider fresh for 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Main hook for fetching all user streams
 */
export function useStreams() {
  const { address, connected } = useWallet();
  const { data: currentBlock = 0 } = useBlockHeight();

  const query = useQuery({
    queryKey: streamQueryKeys.userStreams(address || ""),
    queryFn: async () => {
      if (!address) return { outgoing: [], incoming: [] };
      
      console.log('[Streams] Fetching streams for:', address);
      
      try {
        // Fetch both sBTC and STX streams in parallel
        const [sbtcStreams, stxStreams] = await Promise.all([
          getAllUserStreams(address).catch(err => {
            console.error('[Streams] Error fetching sBTC streams:', err);
            return { outgoing: [], incoming: [] };
          }),
          getAllUserStxStreams(address).catch(err => {
            console.error('[Streams] Error fetching STX streams:', err);
            return { outgoing: [], incoming: [] };
          }),
        ]);
        
        console.log('[Streams] sBTC streams:', sbtcStreams);
        console.log('[Streams] STX streams:', stxStreams);
        
        // Combine both types of streams
        return {
          outgoing: [...sbtcStreams.outgoing, ...stxStreams.outgoing],
          incoming: [...sbtcStreams.incoming, ...stxStreams.incoming],
        };
      } catch (error) {
        console.error('[Streams] Error fetching streams:', error);
        return { outgoing: [], incoming: [] };
      }
    },
    enabled: connected && !!address,
    refetchInterval: STREAM_POLL_INTERVAL,
    staleTime: STREAM_POLL_INTERVAL / 2, // Don't refetch if data is still fresh
    refetchOnWindowFocus: false, // Prevent refetch on tab switch
  });

  // Transform streams with computed metadata
  const processStream = (
    stream: ParsedStream,
    direction: "outgoing" | "incoming"
  ): StreamWithMeta => {
    const totalBlocks = stream.endBlock - stream.startBlock;
    const elapsedBlocks = Math.max(0, currentBlock - stream.startBlock);
    const remainingBlocks = Math.max(0, stream.endBlock - currentBlock);
    
    const progressPercent = stream.progress || 
      (totalBlocks > 0 ? Math.min(100, (elapsedBlocks / totalBlocks) * 100) : 0);
    
    const vestedAmount = stream.vested || 0n;
    const withdrawableAmount = stream.withdrawable || 0n;
    const remainingAmount = stream.totalAmount - vestedAmount;
    const isFullyVested = currentBlock >= stream.endBlock;
    
    // Determine stream status
    let status: StreamStatus;
    if (!stream.active) {
      // Stream has been cancelled or funds fully withdrawn
      status = isFullyVested && stream.withdrawn >= stream.totalAmount ? 'completed' : 'cancelled';
    } else if (isFullyVested && stream.withdrawn >= stream.totalAmount) {
      status = 'completed';
    } else {
      status = 'active';
    }
    
    return {
      ...stream,
      direction,
      status,
      progressPercent: Math.round(progressPercent),
      vestedAmount,
      withdrawableAmount,
      remainingAmount,
      daysRemaining: blocksToDays(remainingBlocks),
      daysTotal: blocksToDays(totalBlocks),
      isFullyVested,
    };
  };

  // Process streams
  const outgoing = (query.data?.outgoing || []).map(s => processStream(s, "outgoing"));
  const incoming = (query.data?.incoming || []).map(s => processStream(s, "incoming"));

  // Calculate stats
  const activeOutgoing = outgoing.filter(s => s.active);
  const activeIncoming = incoming.filter(s => s.active);
  
  const totalStreaming = activeOutgoing.reduce(
    (sum, s) => sum + s.remainingAmount,
    0n
  );
  
  const totalReceived = incoming.reduce(
    (sum, s) => sum + s.withdrawn,
    0n
  );

  const streamsState: StreamsState = {
    outgoing,
    incoming,
    totalStreaming,
    totalReceived,
    activeOutgoingCount: activeOutgoing.length,
    activeIncomingCount: activeIncoming.length,
  };

  return {
    ...query,
    streams: streamsState,
    currentBlock,
  };
}

/**
 * Hook for fetching a single stream by ID
 */
export function useStream(streamId: number) {
  const { address, connected } = useWallet();
  const { data: currentBlock = 0 } = useBlockHeight();

  const query = useQuery({
    queryKey: streamQueryKeys.stream(streamId),
    queryFn: async () => {
      if (!address) return null;
      
      // Try to fetch from both STX and sBTC streams
      // Since stream IDs are separate for each token type, we check both
      const [stxStream, sbtcStream] = await Promise.all([
        getFullStxStreamDetails(streamId, address).catch(() => null),
        getFullStreamDetails(streamId, address).catch(() => null),
      ]);
      
      // Return whichever one exists (prefer STX if both exist somehow)
      return stxStream || sbtcStream;
    },
    enabled: connected && !!address && streamId >= 0,
    refetchInterval: STREAM_POLL_INTERVAL,
    staleTime: STREAM_POLL_INTERVAL / 2,
    refetchOnWindowFocus: false,
  });

  // Add computed metadata
  const stream = query.data
    ? (() => {
        const s = query.data;
        const totalBlocks = s.endBlock - s.startBlock;
        const elapsedBlocks = Math.max(0, currentBlock - s.startBlock);
        const remainingBlocks = Math.max(0, s.endBlock - currentBlock);
        
        const direction: "outgoing" | "incoming" = s.sender === address ? "outgoing" : "incoming";
        const progressPercent = s.progress || 
          (totalBlocks > 0 ? Math.min(100, (elapsedBlocks / totalBlocks) * 100) : 0);
        const isFullyVested = currentBlock >= s.endBlock;
        const vestedAmount = s.vested || 0n;
        
        // Determine stream status
        let status: StreamStatus;
        if (!s.active) {
          status = isFullyVested && s.withdrawn >= s.totalAmount ? 'completed' : 'cancelled';
        } else if (isFullyVested && s.withdrawn >= s.totalAmount) {
          status = 'completed';
        } else {
          status = 'active';
        }
        
        return {
          ...s,
          direction,
          status,
          progressPercent: Math.round(progressPercent),
          vestedAmount,
          withdrawableAmount: s.withdrawable || 0n,
          remainingAmount: s.totalAmount - vestedAmount,
          daysRemaining: blocksToDays(remainingBlocks),
          daysTotal: blocksToDays(totalBlocks),
          isFullyVested,
        } as StreamWithMeta;
      })()
    : null;

  return {
    ...query,
    stream,
    currentBlock,
  };
}

/**
 * Hook for creating a new stream
 */
export function useCreateStream() {
  const { address, refreshBalances } = useWallet();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: Omit<CreateStreamParams, "senderAddress">) => {
      if (!address) throw new Error("Wallet not connected");
      
      const result = await createStreamTx({
        ...params,
        senderAddress: address,
      });

      // Track transaction
      const txInfo = await trackTransaction(result.txId, (info) => {
        if (info.status === "pending") {
          toast({
            title: "Transaction Pending",
            description: "Waiting for confirmation...",
          });
        }
      });

      return { ...result, txInfo, tokenType: params.tokenType };
    },
    onSuccess: async (data) => {
      const tokenSymbol = TOKEN_CONFIG[data.tokenType].symbol;
      if (data.txInfo.status === "success") {
        toast({
          title: "Stream Created!",
          description: `Your ${tokenSymbol} stream has been created successfully.`,
        });
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: streamQueryKeys.all });
        refreshBalances();
      } else {
        toast({
          title: "Transaction Failed",
          description: data.txInfo.error || "Failed to create stream",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create stream",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for withdrawing from a stream
 */
export function useWithdraw() {
  const { address, refreshBalances } = useWallet();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ streamId, expectedAmount, tokenType }: { streamId: number; expectedAmount: bigint; tokenType: TokenType }) => {
      if (!address) throw new Error("Wallet not connected");
      
      const result = await withdrawTx({ streamId, expectedAmount, tokenType });

      // Track transaction - per Stacks docs pattern
      const txInfo = await trackTransaction(result.txId);
      return { ...result, txInfo, tokenType };
    },
    onSuccess: async (data) => {
      const tokenSymbol = TOKEN_CONFIG[data.tokenType].symbol;
      if (data.txInfo.status === "success") {
        toast({
          title: "Withdrawal Successful!",
          description: `${tokenSymbol} has been transferred to your wallet.`,
        });
        queryClient.invalidateQueries({ queryKey: streamQueryKeys.all });
        refreshBalances();
      } else {
        toast({
          title: "Withdrawal Failed",
          description: data.txInfo.error || "Failed to withdraw",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to withdraw",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for cancelling a stream
 */
export function useCancelStream() {
  const { address, refreshBalances } = useWallet();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ streamId, expectedRefund, tokenType }: { streamId: number; expectedRefund: bigint; tokenType: TokenType }) => {
      if (!address) throw new Error("Wallet not connected");
      
      const result = await cancelStreamTx({
        streamId,
        senderAddress: address,
        expectedRefund,
        tokenType,
      });

      // Track transaction - per Stacks docs pattern
      const txInfo = await trackTransaction(result.txId);
      return { ...result, txInfo, tokenType };
    },
    onSuccess: async (data) => {
      const tokenSymbol = TOKEN_CONFIG[data.tokenType].symbol;
      if (data.txInfo.status === "success") {
        toast({
          title: "Stream Cancelled",
          description: `Unvested ${tokenSymbol} has been returned to your wallet.`,
        });
        queryClient.invalidateQueries({ queryKey: streamQueryKeys.all });
        refreshBalances();
      } else {
        toast({
          title: "Cancellation Failed",
          description: data.txInfo.error || "Failed to cancel stream",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel stream",
        variant: "destructive",
      });
    },
  });
}
