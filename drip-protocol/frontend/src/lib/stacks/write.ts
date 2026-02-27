/**
 * DRIP Protocol - Write Transaction Functions
 * 
 * Functions for submitting transactions to the drip-core contract.
 * Uses @stacks/connect request() for wallet interaction.
 */

import { request } from '@stacks/connect';
import { Cl, Pc } from '@stacks/transactions';
import { 
  DRIP_CONTRACT, 
  SBTC_CONTRACT, 
  NETWORK_STRING,
  API_BASE_URL,
  getExplorerTxUrl,
  getErrorMessage,
  parseWalletError,
  validateStacksAddress,
  TOKEN_CONFIG,
  MAX_TX_TRACK_ATTEMPTS,
  type TokenType,
  type TxStatus,
} from './config';

// Type helpers for contract principals
type ContractPrincipal = `${string}.${string}`;
const DRIP_PRINCIPAL = `${DRIP_CONTRACT.address}.${DRIP_CONTRACT.name}` as ContractPrincipal;
const SBTC_PRINCIPAL = `${SBTC_CONTRACT.address}.${SBTC_CONTRACT.name}` as ContractPrincipal;

// ============================================
// Types
// ============================================

export interface TransactionResult {
  txId: string;
}

export interface CreateStreamParams {
  recipient: string;
  amount: bigint;        // Amount in smallest unit (microSTX or sats)
  durationBlocks: number;
  senderAddress: string;
  tokenType: TokenType;  // NEW: Token type selection
}

export interface WithdrawParams {
  streamId: number;
  expectedAmount: bigint; // For post-condition
  tokenType: TokenType;   // NEW: Token type for correct post-conditions
}

export interface CancelStreamParams {
  streamId: number;
  senderAddress: string;
  expectedRefund: bigint; // For post-condition
  tokenType: TokenType;   // NEW: Token type for correct post-conditions
}

// ============================================
// Transaction Functions
// ============================================

/**
 * Create a new payment stream
 * 
 * @param params - Stream creation parameters
 * @returns Transaction result with txId
 * 
 * Per Stacks docs: Uses request('stx_callContract', ...) with post-conditions
 * to protect user assets. Supports both STX and sBTC tokens.
 */
export async function createStream(params: CreateStreamParams): Promise<TransactionResult> {
  const { recipient, amount, durationBlocks, senderAddress, tokenType } = params;
  const tokenConfig = TOKEN_CONFIG[tokenType];

  // Build post-condition based on token type
  // Per Stacks docs: Pc.principal().willSendEq().ustx() for STX transfers
  let postCondition;
  if (tokenType === 'STX') {
    // STX post-condition: Sender will send exactly this amount of STX (in microSTX)
    postCondition = Pc.principal(senderAddress)
      .willSendEq(amount)
      .ustx();
  } else {
    // Per Stacks docs: .ft() for fungible token post-conditions
    // sBTC post-condition: Sender will send exactly this amount of sBTC to the contract
    postCondition = Pc.principal(senderAddress)
      .willSendEq(amount)
      .ft(SBTC_PRINCIPAL, SBTC_CONTRACT.assetName);
  }

  try {
    // Per Stacks docs: request('stx_callContract') for wallet contract calls
    const result = await request('stx_callContract', {
      contract: DRIP_PRINCIPAL,
      functionName: tokenConfig.contractFunction,
      functionArgs: [
        Cl.principal(recipient),
        Cl.uint(amount),
        Cl.uint(durationBlocks),
      ],
      network: NETWORK_STRING,
      postConditions: [postCondition],
      postConditionMode: 'deny', // Per Stacks docs: 'deny' = strict mode
    });

    return {
      txId: result.txid,
    };
  } catch (error) {
    // Per Stacks docs: Handle wallet errors with standard pattern
    throw new Error(parseWalletError(error));
  }
}

/**
 * Withdraw vested funds from a stream
 * 
 * @param params - Withdrawal parameters
 * @returns Transaction result with txId
 * 
 * Per Stacks docs: Post-condition ensures contract sends correct amount.
 */
export async function withdraw(params: WithdrawParams): Promise<TransactionResult> {
  const { streamId, expectedAmount, tokenType } = params;
  const tokenConfig = TOKEN_CONFIG[tokenType];

  // Build post-condition based on token type
  // Per Stacks docs: Use willSendLte because actual amount might vary due to block timing
  let postCondition;
  if (tokenType === 'STX') {
    postCondition = Pc.principal(DRIP_PRINCIPAL)
      .willSendLte(expectedAmount)
      .ustx();
  } else {
    postCondition = Pc.principal(DRIP_PRINCIPAL)
      .willSendLte(expectedAmount)
      .ft(SBTC_PRINCIPAL, SBTC_CONTRACT.assetName);
  }

  try {
    const result = await request('stx_callContract', {
      contract: DRIP_PRINCIPAL,
      functionName: tokenConfig.withdrawFunction,
      functionArgs: [Cl.uint(streamId)],
      network: NETWORK_STRING,
      postConditions: [postCondition],
      postConditionMode: 'deny',
    });

    return {
      txId: result.txid,
    };
  } catch (error) {
    throw new Error(parseWalletError(error));
  }
}

/**
 * Cancel a stream and refund unvested funds
 * 
 * @param params - Cancellation parameters  
 * @returns Transaction result with txId
 * 
 * Per Stacks docs: Multiple post-conditions for complex transactions.
 */
export async function cancelStream(params: CancelStreamParams): Promise<TransactionResult> {
  const { streamId, senderAddress, expectedRefund, tokenType } = params;
  const tokenConfig = TOKEN_CONFIG[tokenType];

  // Post-conditions for cancel:
  // Per Stacks docs: Contract may send tokens to sender (refund) and/or recipient (vested portion)
  const postConditions = [];
  
  if (expectedRefund > 0n) {
    // Build post-condition based on token type
    if (tokenType === 'STX') {
      postConditions.push(
        Pc.principal(DRIP_PRINCIPAL)
          .willSendLte(expectedRefund + 1000000n) // Add buffer for rounding
          .ustx()
      );
    } else {
      postConditions.push(
        Pc.principal(DRIP_PRINCIPAL)
          .willSendLte(expectedRefund + 1000000n) // Add buffer for rounding
          .ft(SBTC_PRINCIPAL, SBTC_CONTRACT.assetName)
      );
    }
  }

  try {
    const result = await request('stx_callContract', {
      contract: DRIP_PRINCIPAL,
      functionName: tokenConfig.cancelFunction,
      functionArgs: [Cl.uint(streamId)],
      network: NETWORK_STRING,
      postConditions,
      // Per Stacks docs: 'allow' mode if no specific post-conditions needed
      postConditionMode: expectedRefund > 0n ? 'deny' : 'allow',
    });

    return {
      txId: result.txid,
    };
  } catch (error) {
    throw new Error(parseWalletError(error));
  }
}

// ============================================
// Transaction Tracking (per Stacks docs patterns)
// ============================================

export interface TxInfo {
  status: TxStatus;
  blockHeight?: number;
  result?: unknown;
  error?: string;
  explorerUrl?: string;
}

/**
 * Track transaction status until confirmation
 * Per Stacks docs: Uses /extended/v1/tx/{txid} endpoint
 * 
 * @param txId - Transaction ID to track
 * @param onUpdate - Callback for status updates
 * @param maxAttempts - Maximum polling attempts (default from config)
 */
export async function trackTransaction(
  txId: string,
  onUpdate?: (info: TxInfo) => void,
  maxAttempts: number = MAX_TX_TRACK_ATTEMPTS
): Promise<TxInfo> {
  const explorerUrl = getExplorerTxUrl(txId);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Per Stacks docs: /extended/v1/tx/{txid} for transaction details
      const response = await fetch(`${API_BASE_URL}/extended/v1/tx/${txId}`);
      
      if (!response.ok) {
        // Transaction might not be indexed yet - per Stacks docs this is normal
        if (response.status === 404) {
          const info: TxInfo = { status: 'pending', explorerUrl };
          onUpdate?.(info);
          await sleep(3000);
          continue;
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const info: TxInfo = {
        status: data.tx_status as TxStatus,
        blockHeight: data.block_height,
        result: data.tx_result,
        explorerUrl,
      };

      // Handle abort/error per Stacks docs
      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        info.status = data.tx_status;
        // Try to parse error code from contract response
        if (data.tx_result?.repr) {
          const match = data.tx_result.repr.match(/\(err u(\d+)\)/);
          if (match) {
            info.error = getErrorMessage(Number(match[1]));
          } else {
            info.error = data.tx_result.repr;
          }
        }
        if (data.tx_status === 'abort_by_post_condition') {
          info.error = 'Transaction aborted: Post-condition failed. The transfer amounts did not match expectations.';
        }
      }

      onUpdate?.(info);

      // If finalized, return
      if (data.tx_status === 'success' || 
          data.tx_status === 'abort_by_response' || 
          data.tx_status === 'abort_by_post_condition') {
        return info;
      }

      // Wait before next poll (per Stacks docs, blocks are ~10 min so poll every 10s)
      await sleep(10000);
    } catch (error) {
      console.error('[TxTrack] Error tracking transaction:', error);
      // Don't fail immediately, keep trying
      await sleep(5000);
    }
  }

  return { 
    status: 'pending', 
    error: 'Timeout waiting for confirmation. Transaction may still be processing.', 
    explorerUrl 
  };
}

/**
 * Get explorer URL for a transaction
 */
export function getTxExplorerUrl(txId: string): string {
  return getExplorerTxUrl(txId);
}

// ============================================
// Utilities
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate a Stacks address format
 * Per Stacks docs: Testnet addresses start with ST, mainnet with SP
 */
export function isValidStacksAddress(address: string): boolean {
  return validateStacksAddress(address, 'testnet');
}

/**
 * Validate stream creation parameters
 */
export function validateCreateStreamParams(params: CreateStreamParams): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!isValidStacksAddress(params.recipient)) {
    errors.push('Invalid recipient address. Must be a valid testnet (ST) address.');
  }

  if (params.recipient === params.senderAddress) {
    errors.push('Cannot create stream to yourself.');
  }

  if (params.amount <= 0n) {
    errors.push('Amount must be greater than 0.');
  }

  if (params.durationBlocks <= 0) {
    errors.push('Duration must be greater than 0 blocks.');
  }

  // Minimum 10 minutes (1 block)
  if (params.durationBlocks < 1) {
    errors.push('Duration must be at least 1 block (~10 minutes).');
  }

  // Maximum 1 year (~52,560 blocks)
  if (params.durationBlocks > 52560) {
    errors.push('Duration cannot exceed 1 year.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
