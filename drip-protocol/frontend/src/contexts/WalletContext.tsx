/**
 * DRIP Protocol - Wallet Context
 * 
 * Provides wallet connection state and methods using @stacks/connect.
 * Per Stacks docs: Uses connect() for wallet connection and disconnect() for cleanup.
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect,
  useMemo,
} from "react";
import { 
  connect, 
  disconnect as stacksDisconnect, 
  isConnected as checkConnected,
  getLocalStorage,
} from "@stacks/connect";
import { 
  getBalances, 
  satsToSbtc, 
  microStxToStx,
  BALANCE_POLL_INTERVAL,
  TESTNET_FAUCET_URL,
  parseWalletError,
  validateStacksAddress,
} from "@/lib/stacks";

// ============================================
// Types
// ============================================

interface WalletState {
  connected: boolean;
  address: string | null;
  stxBalance: bigint;
  sbtcBalance: bigint;
  isLoading: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalances: () => Promise<void>;
  // Computed values
  stxBalanceFormatted: number;
  sbtcBalanceFormatted: number;
  shortAddress: string | null;
  faucetUrl: string;
}

// ============================================
// Context
// ============================================

const WalletContext = createContext<WalletContextType | null>(null);

// ============================================
// Provider
// ============================================

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    stxBalance: 0n,
    sbtcBalance: 0n,
    isLoading: true,
    error: null,
  });

  // Check if already connected on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        // Per Stacks docs: getLocalStorage() returns { addresses: { stx: [{address}], btc: [{address}] } }
        const stored = getLocalStorage();
        console.log('[Wallet] Checking stored session:', stored);
        
        let userAddress: string | undefined;
        
        if (stored?.addresses?.stx?.[0]?.address) {
          // New format (8.x.x): addresses.stx[0].address
          userAddress = stored.addresses.stx[0].address;
          console.log('[Wallet] Found address in new format:', userAddress);
        } else if (Array.isArray(stored?.addresses)) {
          // Legacy format: addresses array with [mainnetSTX, mainnetBTC, testnetSTX, testnetBTC]
          userAddress = stored.addresses[2]?.address || stored.addresses[0]?.address;
          console.log('[Wallet] Found address in legacy format:', userAddress);
        }
        
        // Validate it's a testnet address (starts with ST)
        if (userAddress && userAddress.startsWith('ST')) {
          console.log('[Wallet] Restoring testnet session for:', userAddress);
          setState(prev => ({
            ...prev,
            connected: true,
            address: userAddress!,
            isLoading: false,
          }));
          
          // Fetch balances
          try {
            const balances = await getBalances(userAddress);
            setState(prev => ({
              ...prev,
              stxBalance: balances.stx,
              sbtcBalance: balances.sbtc,
            }));
          } catch (balanceError) {
            console.error('[Wallet] Error fetching balances:', balanceError);
          }
          return;
        } else if (userAddress) {
          // Has address but not testnet - might be mainnet
          console.log('[Wallet] Found address but not testnet:', userAddress);
        }
        
        console.log('[Wallet] No existing session found');
        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('[Wallet] Error checking existing connection:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkExistingConnection();
  }, []);

  // Poll for balance updates
  useEffect(() => {
    if (!state.address) return;

    const pollBalances = async () => {
      try {
        const balances = await getBalances(state.address!);
        setState(prev => ({
          ...prev,
          stxBalance: balances.stx,
          sbtcBalance: balances.sbtc,
        }));
      } catch (error) {
        console.error("Error polling balances:", error);
      }
    };

    const interval = setInterval(pollBalances, BALANCE_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [state.address]);

  /**
   * Connect wallet using @stacks/connect
   * Per Stacks docs: connect() initiates wallet connection and stores addresses
   */
  const connectWallet = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Per Stacks docs: connect() with options
      const response = await connect();
      console.log('[Wallet] Connect response:', response);

      // Handle both new format (8.x.x) and legacy format
      let userAddress: string | undefined;
      
      if (response.addresses?.stx?.[0]?.address) {
        // New format: { addresses: { stx: [{address}], btc: [{address}] } }
        userAddress = response.addresses.stx[0].address;
      } else if (Array.isArray(response.addresses)) {
        // Legacy format: [mainnetSTX, mainnetBTC, testnetSTX, testnetBTC]
        userAddress = response.addresses[2]?.address || response.addresses[0]?.address;
      }
      
      // Validate we got a testnet address
      // Per Stacks docs: Validate it's a testnet address (starts with ST)
      if (!userAddress || !validateStacksAddress(userAddress, 'testnet')) {
        throw new Error("No testnet address found. Please switch your wallet to testnet.");
      }

      console.log('[Wallet] Connected with address:', userAddress);

      // Fetch balances
      const balances = await getBalances(userAddress);

      setState({
        connected: true,
        address: userAddress,
        stxBalance: balances.stx,
        sbtcBalance: balances.sbtc,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Per Stacks docs: Use standard error handling pattern
      const message = parseWalletError(error);
      console.error("[Wallet] Connection error:", error);
      setState(prev => ({
        ...prev,
        connected: false,
        address: null,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  /**
   * Disconnect wallet
   * Per Stacks docs: disconnect() clears stored session
   */
  const disconnectWallet = useCallback(() => {
    stacksDisconnect();
    setState({
      connected: false,
      address: null,
      stxBalance: 0n,
      sbtcBalance: 0n,
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Manually refresh balances
   */
  const refreshBalances = useCallback(async () => {
    if (!state.address) return;

    try {
      const balances = await getBalances(state.address);
      setState(prev => ({
        ...prev,
        stxBalance: balances.stx,
        sbtcBalance: balances.sbtc,
      }));
    } catch (error) {
      console.error("Error refreshing balances:", error);
    }
  }, [state.address]);

  // Computed values
  const stxBalanceFormatted = useMemo(
    () => microStxToStx(state.stxBalance),
    [state.stxBalance]
  );

  const sbtcBalanceFormatted = useMemo(
    () => satsToSbtc(state.sbtcBalance),
    [state.sbtcBalance]
  );

  const shortAddress = useMemo(() => {
    if (!state.address) return null;
    return `${state.address.slice(0, 6)}...${state.address.slice(-4)}`;
  }, [state.address]);

  const value = useMemo(
    () => ({
      ...state,
      connectWallet,
      disconnectWallet,
      refreshBalances,
      stxBalanceFormatted,
      sbtcBalanceFormatted,
      shortAddress,
      faucetUrl: TESTNET_FAUCET_URL,
    }),
    [
      state,
      connectWallet,
      disconnectWallet,
      refreshBalances,
      stxBalanceFormatted,
      sbtcBalanceFormatted,
      shortAddress,
    ]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}
