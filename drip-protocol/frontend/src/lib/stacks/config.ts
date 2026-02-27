/**
 * DRIP Protocol - Stacks Configuration
 * 
 * Testnet configuration for the DRIP streaming payments protocol.
 * Uses official Stacks SDK with Hiro API endpoints.
 */

import { STACKS_TESTNET } from '@stacks/network';

// Network configuration - TESTNET ONLY
export const NETWORK = STACKS_TESTNET;
export const NETWORK_STRING = 'testnet' as const;

// API endpoints
export const API_BASE_URL = 'https://api.testnet.hiro.so';

// DRIP Protocol contract (deployed on testnet)
export const DRIP_CONTRACT = {
  address: 'ST1SCQ368DK29NW9TFNJXX7HZM90QT9X5JVDKXQ99',
  name: 'drip-core-testnet',
  get principal() {
    return `${this.address}.${this.name}`;
  },
} as const;

// sBTC Token contract (testnet)
export const SBTC_CONTRACT = {
  address: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT',
  name: 'sbtc-token',
  assetName: 'sbtc-token',
  get principal() {
    return `${this.address}.${this.name}`;
  },
} as const;

// Supported token types for streams
export type TokenType = 'STX' | 'sBTC';

export const TOKEN_CONFIG = {
  STX: {
    symbol: 'STX',
    name: 'Stacks',
    decimals: 6,
    icon: '⚡', // Can be replaced with actual icon
    contractFunction: 'create-stx-stream', // Contract function for STX streams
    withdrawFunction: 'withdraw-stx',
    cancelFunction: 'cancel-stx-stream',
  },
  sBTC: {
    symbol: 'sBTC',
    name: 'sBTC (Testnet)',
    decimals: 8,
    icon: '₿',
    contractFunction: 'create-stream', // Existing contract function
    withdrawFunction: 'withdraw',
    cancelFunction: 'cancel-stream',
  },
} as const;

// Explorer URLs
export const EXPLORER_BASE_URL = 'https://explorer.hiro.so';
export const getExplorerTxUrl = (txId: string) => 
  `${EXPLORER_BASE_URL}/txid/${txId}?chain=testnet`;
export const getExplorerAddressUrl = (address: string) => 
  `${EXPLORER_BASE_URL}/address/${address}?chain=testnet`;
export const getExplorerContractUrl = (principal: string) =>
  `${EXPLORER_BASE_URL}/address/${principal}?chain=testnet`;

// Alias for convenience
export const explorerTxUrl = getExplorerTxUrl;

// Stacks faucet for testnet
export const TESTNET_FAUCET_URL = 'https://explorer.hiro.so/sandbox/faucet?chain=testnet';

// Contract error codes (from drip-core.clar)
export const CONTRACT_ERRORS = {
  100: 'ERR-NOT-AUTHORIZED',
  101: 'ERR-STREAM-NOT-FOUND',
  102: 'ERR-STREAM-DEPLETED',
  103: 'ERR-INVALID-AMOUNT',
  104: 'ERR-INVALID-DURATION',
  105: 'ERR-NOT-RECIPIENT',
  106: 'ERR-NOT-SENDER',
  107: 'ERR-STREAM-NOT-ACTIVE',
  108: 'ERR-TRANSFER-FAILED',
  109: 'ERR-STX-TRANSFER-FAILED',
} as const;

export type ContractErrorCode = keyof typeof CONTRACT_ERRORS;

export function getErrorMessage(code: number): string {
  return CONTRACT_ERRORS[code as ContractErrorCode] || `Unknown error: ${code}`;
}

// Block time estimation (Stacks blocks are ~10 minutes on average)
export const BLOCKS_PER_MINUTE = 0.1;
export const BLOCKS_PER_HOUR = 6;
export const BLOCKS_PER_DAY = 144;
export const BLOCKS_PER_WEEK = 1008;
export const BLOCKS_PER_MONTH = 4320; // ~30 days

export function blocksToSeconds(blocks: number): number {
  return blocks * 600; // 10 minutes per block
}

export function blocksToDays(blocks: number): number {
  return blocks / BLOCKS_PER_DAY;
}

// Alias
export const blocksToApproxDays = blocksToDays;

export function daysToBlocks(days: number): number {
  return Math.floor(days * BLOCKS_PER_DAY);
}

// Address formatting
export function formatAddress(address: string, prefixLen: number = 4, suffixLen: number = 4): string {
  if (!address || address.length <= prefixLen + suffixLen + 3) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

// sBTC formatting (8 decimals like Bitcoin)
export const SBTC_DECIMALS = 8;

export function satsToSbtc(sats: bigint | number): number {
  const satsBigInt = typeof sats === 'bigint' ? sats : BigInt(sats);
  return Number(satsBigInt) / 10 ** SBTC_DECIMALS;
}

export function sbtcToSats(sbtc: number): bigint {
  return BigInt(Math.floor(sbtc * 10 ** SBTC_DECIMALS));
}

export function formatSbtc(sats: bigint | number, decimals: number = 8): string {
  const value = satsToSbtc(sats);
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

// STX formatting (6 decimals)
export const STX_DECIMALS = 6;

export function microStxToStx(microStx: bigint | number): number {
  const micro = typeof microStx === 'bigint' ? microStx : BigInt(microStx);
  return Number(micro) / 10 ** STX_DECIMALS;
}

export function stxToMicroStx(stx: number): bigint {
  return BigInt(Math.floor(stx * 10 ** STX_DECIMALS));
}

export function formatStx(microStx: bigint | number, decimals: number = 2): string {
  return microStxToStx(microStx).toFixed(decimals);
}

// Generic token amount conversion
export function toSmallestUnit(amount: number, tokenType: TokenType): bigint {
  if (tokenType === 'STX') {
    return stxToMicroStx(amount);
  }
  return sbtcToSats(amount);
}

export function fromSmallestUnit(amount: bigint | number, tokenType: TokenType): number {
  if (tokenType === 'STX') {
    return microStxToStx(amount);
  }
  return satsToSbtc(amount);
}

export function formatTokenAmount(amount: bigint | number, tokenType: TokenType): string {
  if (tokenType === 'STX') {
    return formatStx(amount, 4);
  }
  return formatSbtc(amount, 8);
}

// Polling intervals (increased to avoid rate limiting)
export const BALANCE_POLL_INTERVAL = 60000; // 60 seconds
export const STREAM_POLL_INTERVAL = 30000;  // 30 seconds
export const TX_POLL_INTERVAL = 5000;       // 5 seconds for pending tx
export const TX_CONFIRMATION_TIMEOUT = 600000; // 10 minutes max wait

// Transaction defaults
export const DEFAULT_FEE = 2000n; // 0.002 STX in microSTX
export const MAX_TX_TRACK_ATTEMPTS = 60; // 60 attempts * 10s = 10 minutes

// Transaction status types per Stacks API
export type TxStatus = 'pending' | 'success' | 'abort_by_response' | 'abort_by_post_condition';

/**
 * Parse wallet/transaction errors per Stacks docs error handling patterns
 */
export function parseWalletError(error: unknown): string {
  if (!error) return 'Unknown error occurred';
  
  // Handle user cancellation
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('cancel') || msg.includes('rejected') || msg.includes('denied')) {
      return 'Transaction was cancelled by user';
    }
    if (msg.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }
    return error.message;
  }
  
  // Handle JSON-RPC errors from wallet
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.code && err.message) {
      return `Wallet error: ${err.message}`;
    }
  }
  
  return String(error);
}

/**
 * Validate Stacks address per Stacks docs address validation
 */
export function validateStacksAddress(address: string, network: 'mainnet' | 'testnet' = 'testnet'): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Per Stacks docs: Mainnet starts with SP, testnet starts with ST
  const prefix = network === 'mainnet' ? 'SP' : 'ST';
  
  // Check prefix
  if (!address.startsWith(prefix)) return false;
  
  // Check length (28-41 characters for standard addresses)
  if (address.length < 28 || address.length > 41) return false;
  
  // Check valid c32 characters (no O, I, L, 0 per c32check encoding)
  const validChars = /^S[PT][0123456789ABCDEFGHJKMNPQRSTVWXYZ]+$/;
  return validChars.test(address);
}
