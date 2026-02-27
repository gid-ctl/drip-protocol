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
import { c32addressDecode, c32address } from 'c32check';
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
// Address Conversion Utilities
// ============================================

/**
 * Convert a mainnet address (SP) to testnet format (ST)
 * Per Stacks docs: Both share the same hash bytes, just different version prefixes
 */
function mainnetToTestnet(mainnetAddress: string): string {
  try {
    if (!mainnetAddress.startsWith('SP') && !mainnetAddress.startsWith('SM')) {
      // Already testnet or invalid
      return mainnetAddress;
    }
    
    // Decode the mainnet address to get version and hash
    const decoded = c32addressDecode(mainnetAddress);
    const version = decoded[0];
    const hashHex = decoded[1];
    
    // Map mainnet versions to testnet versions
    // Mainnet: p2pkh=22 (SP), p2sh=20 (SM)
    // Testnet: p2pkh=26 (ST), p2sh=21 (SN)
    let testnetVersion: number;
    if (version === 22) {
      // Standard mainnet (SP) -> Standard testnet (ST)
      testnetVersion = 26;
    } else if (version === 20) {
      // Multisig mainnet (SM) -> Multisig testnet (SN)
      testnetVersion = 21;
    } else {
      // Unknown version, return original
      return mainnetAddress;
    }
    
    // Re-encode with testnet version
    return c32address(testnetVersion, hashHex);
  } catch (error) {
    console.error('[Wallet] Error converting address to testnet:', error);
    return mainnetAddress;
  }
}

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
  // Per Stacks docs: "The connection persists across page reloads"
  // Use isConnected() to check and getLocalStorage() to retrieve addresses
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        // Per Stacks docs: isConnected() checks if a wallet is currently connected
        // Note: This may return false if the wallet extension hasn't loaded yet
        const providerConnected = checkConnected();
        console.log('[Wallet] isConnected():', providerConnected);
        
        // Per Stacks docs: getLocalStorage() retrieves stored connection data
        // This persists across page reloads even if the provider isn't ready
        let stored = getLocalStorage();
        console.log('[Wallet] getLocalStorage() result:', stored);
        
        // Fallback: Check raw localStorage for stacks-connect data
        // @stacks/connect stores data under 'stacks-connect' key
        if (!stored || !stored.addresses) {
          try {
            const rawData = localStorage.getItem('stacks-connect');
            if (rawData) {
              stored = JSON.parse(rawData);
              console.log('[Wallet] Found raw localStorage data:', stored);
            }
          } catch (parseError) {
            console.warn('[Wallet] Error parsing raw localStorage:', parseError);
          }
        }
        
        let userAddress: string | undefined;
        
        // Look for testnet address (starts with ST) in the stored data
        // Note: getLocalStorage() typically only stores mainnet (SP) addresses
        // We need to convert mainnet to testnet if no testnet address found
        if (stored?.addresses?.stx && Array.isArray(stored.addresses.stx)) {
          // New format (8.x.x): addresses.stx is an array of address objects
          console.log('[Wallet] All STX addresses in storage:', 
            stored.addresses.stx.map((e: any) => e?.address)
          );
          
          // First, try to find a testnet address (starts with ST)
          const testnetEntry = stored.addresses.stx.find(
            (entry: any) => entry?.address?.startsWith('ST')
          );
          if (testnetEntry?.address) {
            userAddress = testnetEntry.address;
            console.log('[Wallet] Found testnet address in stx array:', userAddress);
          } else {
            // No testnet address found - convert mainnet address to testnet
            const mainnetEntry = stored.addresses.stx.find(
              (entry: any) => entry?.address?.startsWith('SP') || entry?.address?.startsWith('SM')
            );
            if (mainnetEntry?.address) {
              const convertedAddress = mainnetToTestnet(mainnetEntry.address);
              console.log('[Wallet] Converted mainnet to testnet:', mainnetEntry.address, '->', convertedAddress);
              userAddress = convertedAddress;
            }
          }
        } else if (Array.isArray(stored?.addresses)) {
          // Legacy format: addresses array with mixed entries
          const testnetEntry = stored.addresses.find(
            (entry: any) => entry?.address?.startsWith('ST')
          );
          if (testnetEntry?.address) {
            userAddress = testnetEntry.address;
          } else {
            // Convert mainnet to testnet
            const mainnetEntry = stored.addresses.find(
              (entry: any) => entry?.address?.startsWith('SP') || entry?.address?.startsWith('SM')
            );
            if (mainnetEntry?.address) {
              userAddress = mainnetToTestnet(mainnetEntry.address);
            }
          }
          console.log('[Wallet] Found address in legacy format:', userAddress);
        }
        
        // Validate it's a testnet address (starts with ST)
        // Per Stacks docs: We can restore the session from localStorage even if
        // the wallet provider isn't fully initialized yet
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
        
        console.log('[Wallet] No valid testnet address in storage');
        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('[Wallet] Error checking existing connection:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkExistingConnection();
  }, []);

  // Listen for storage changes (cross-tab synchronization)
  // Per Stacks docs: connection persists across page reloads
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'stacks-connect' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          // Find testnet address in stx array, or convert from mainnet
          let userAddress: string | undefined;
          if (data?.addresses?.stx && Array.isArray(data.addresses.stx)) {
            const testnetEntry = data.addresses.stx.find(
              (entry: any) => entry?.address?.startsWith('ST')
            );
            if (testnetEntry?.address) {
              userAddress = testnetEntry.address;
            } else {
              // Convert mainnet to testnet
              const mainnetEntry = data.addresses.stx.find(
                (entry: any) => entry?.address?.startsWith('SP') || entry?.address?.startsWith('SM')
              );
              if (mainnetEntry?.address) {
                userAddress = mainnetToTestnet(mainnetEntry.address);
              }
            }
          }
          
          if (userAddress && !state.connected) {
            console.log('[Wallet] Detected connection from storage event:', userAddress);
            setState(prev => ({
              ...prev,
              connected: true,
              address: userAddress,
            }));
            // Fetch balances
            getBalances(userAddress).then(balances => {
              setState(prev => ({
                ...prev,
                stxBalance: balances.stx,
                sbtcBalance: balances.sbtc,
              }));
            }).catch(console.error);
          }
        } catch (e) {
          console.warn('[Wallet] Error parsing storage event:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [state.connected]);

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
      
      // Cast to any to handle both address formats
      const addresses = response.addresses as any;
      
      // Check if addresses.stx exists (new format with stx/btc objects)
      if (addresses?.stx && Array.isArray(addresses.stx)) {
        // New format: { addresses: { stx: [{address}], btc: [{address}] } }
        // Find testnet address (starts with ST)
        const testnetEntry = addresses.stx.find((a: any) => a?.address?.startsWith('ST'));
        userAddress = testnetEntry?.address || addresses.stx[0]?.address;
        console.log('[Wallet] Found address in new format:', userAddress);
      } else if (Array.isArray(addresses)) {
        // Legacy format: flat array of address objects
        // Find first testnet address (starts with ST)
        const testnetEntry = addresses.find((a: any) => a?.address?.startsWith('ST'));
        userAddress = testnetEntry?.address;
        console.log('[Wallet] Found testnet in array:', userAddress);
        
        // If no testnet found, log all addresses for debugging
        if (!userAddress) {
          console.log('[Wallet] All addresses:', addresses.map((a: any) => a?.address));
          userAddress = addresses[0]?.address;
        }
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
