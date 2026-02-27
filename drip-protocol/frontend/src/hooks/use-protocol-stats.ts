/**
 * Hook to fetch real protocol statistics from the blockchain
 */

import { useState, useEffect } from 'react';
import { 
  getStreamCount, 
  getStream,
  getStxStreamCount,
  getStxStream,
  DRIP_CONTRACT,
  API_BASE_URL,
} from '@/lib/stacks';

export interface ProtocolStats {
  totalStreamed: number;
  activeStreams: number;
  totalTransactions: number;
  loading: boolean;
  error: string | null;
}

// Use a valid testnet address (ST prefix) for read-only calls
// This is the contract deployer address - any valid testnet address works
const DUMMY_ADDRESS = 'ST1SCQ368DK29NW9TFNJXX7HZM90QT9X5JVDKXQ99';

/**
 * Fetch protocol-wide statistics from the drip-core contract
 */
export function useProtocolStats() {
  const [stats, setStats] = useState<ProtocolStats>({
    totalStreamed: 0,
    activeStreams: 0,
    totalTransactions: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        console.log('[useProtocolStats] Fetching protocol statistics...');
        
        // Get total stream counts for both sBTC and STX
        const [sbtcStreamCount, stxStreamCount] = await Promise.all([
          getStreamCount(DUMMY_ADDRESS).catch(() => 0),
          getStxStreamCount(DUMMY_ADDRESS).catch(() => 0),
        ]);

        console.log('[useProtocolStats] Stream counts:', { sbtcStreamCount, stxStreamCount });

        // Calculate active streams (streams that are currently active)
        let activeCount = 0;
        let totalAmountStreamed = 0n;

        // Fetch sBTC streams
        const sbtcPromises = [];
        for (let i = 0; i < sbtcStreamCount; i++) {
          sbtcPromises.push(
            getStream(i, DUMMY_ADDRESS).catch(() => null)
          );
        }

        // Fetch STX streams
        const stxPromises = [];
        for (let i = 0; i < stxStreamCount; i++) {
          stxPromises.push(
            getStxStream(i, DUMMY_ADDRESS).catch(() => null)
          );
        }

        const [sbtcStreams, stxStreams] = await Promise.all([
          Promise.all(sbtcPromises),
          Promise.all(stxPromises),
        ]);

        // Process sBTC streams
        for (const stream of sbtcStreams) {
          if (stream) {
            if (stream.active) {
              activeCount++;
            }
            // Add to total amount (convert from satoshis to BTC: divide by 100,000,000)
            totalAmountStreamed += stream.totalAmount;
          }
        }

        // Process STX streams (STX has 6 decimals, but we'll count them separately or convert to sBTC equivalent)
        for (const stream of stxStreams) {
          if (stream) {
            if (stream.active) {
              activeCount++;
            }
            // For STX, we could convert to USD or just count streams
            // For simplicity, we'll just count active streams
          }
        }

        // Convert total amount from smallest unit to sBTC (8 decimals)
        const totalSbtc = Number(totalAmountStreamed) / 100_000_000;

        // Get transaction count from Hiro API
        let txCount = 0;
        try {
          const txResponse = await fetch(
            `${API_BASE_URL}/extended/v1/address/${DRIP_CONTRACT.address}.${DRIP_CONTRACT.name}/transactions?limit=1`
          );
          if (txResponse.ok) {
            const txData = await txResponse.json();
            txCount = txData.total || 0;
          }
        } catch (error) {
          console.warn('[useProtocolStats] Failed to fetch transaction count:', error);
          // Fallback: estimate based on streams (create + withdrawals + cancels)
          txCount = (sbtcStreamCount + stxStreamCount) * 3;
        }

        if (isMounted) {
          setStats({
            totalStreamed: totalSbtc,
            activeStreams: activeCount,
            totalTransactions: txCount,
            loading: false,
            error: null,
          });

          console.log('[useProtocolStats] Stats updated:', {
            totalStreamed: totalSbtc,
            activeStreams: activeCount,
            totalTransactions: txCount,
          });
        }
      } catch (error) {
        console.error('[useProtocolStats] Error fetching stats:', error);
        if (isMounted) {
          setStats({
            totalStreamed: 0,
            activeStreams: 0,
            totalTransactions: 0,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch protocol stats',
          });
        }
      }
    }

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return stats;
}
