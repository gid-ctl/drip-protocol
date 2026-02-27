import { useQuery } from "@tanstack/react-query";

interface PriceData {
  stx: number;
  btc: number;
  lastUpdated: Date;
}

// CoinGecko free API - no API key needed
const COINGECKO_API = "https://api.coingecko.com/api/v3";

async function fetchPrices(): Promise<PriceData> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=blockstack,bitcoin&vs_currencies=usd`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Price API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      stx: data.blockstack?.usd ?? 0,
      btc: data.bitcoin?.usd ?? 0,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.warn("[Prices] Failed to fetch prices, using fallback:", error);
    // Return fallback prices if API fails
    return {
      stx: 1.85,
      btc: 100000,
      lastUpdated: new Date(),
    };
  }
}

export function usePrices() {
  const query = useQuery({
    queryKey: ["prices"],
    queryFn: fetchPrices,
    staleTime: 60000, // Consider fresh for 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return {
    stxPrice: query.data?.stx ?? 1.85,
    btcPrice: query.data?.btc ?? 100000,
    // sBTC is pegged 1:1 with BTC
    sbtcPrice: query.data?.btc ?? 100000,
    lastUpdated: query.data?.lastUpdated,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

// Helper to get USD value based on token type
export function getUsdValue(
  amount: number,
  tokenType: "STX" | "sBTC",
  prices: { stxPrice: number; sbtcPrice: number }
): number {
  const price = tokenType === "STX" ? prices.stxPrice : prices.sbtcPrice;
  return amount * price;
}

// Format USD with appropriate precision
export function formatUsd(usd: number): string {
  if (usd >= 1000) {
    return `≈ $${usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  if (usd >= 1) {
    return `≈ $${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `≈ $${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}
