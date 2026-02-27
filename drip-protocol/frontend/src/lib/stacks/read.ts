/**
 * DRIP Protocol - Read-Only Contract Functions
 * 
 * Functions for reading data from the drip-core contract.
 * Uses fetchCallReadOnlyFunction from @stacks/transactions.
 */

import { 
  fetchCallReadOnlyFunction, 
  Cl, 
  cvToValue,
  ClarityType,
  type ClarityValue,
} from '@stacks/transactions';
import { 
  DRIP_CONTRACT, 
  SBTC_CONTRACT,
  API_BASE_URL,
  NETWORK_STRING,
} from './config';

// ============================================
// Types
// ============================================

export interface StreamData {
  sender: string;
  recipient: string;
  totalAmount: bigint;
  withdrawn: bigint;
  startBlock: number;
  endBlock: number;
  active: boolean;
}

export interface ParsedStream {
  id: number;
  sender: string;
  recipient: string;
  totalAmount: bigint;
  withdrawn: bigint;
  startBlock: number;
  endBlock: number;
  active: boolean;
  // Token type (defaults to 'sBTC' for existing streams)
  tokenType: 'STX' | 'sBTC';
  // Computed fields
  vested?: bigint;
  withdrawable?: bigint;
  progress?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract raw value from cvToValue result which may return nested objects
 */
function extractValue(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  
  // Handle objects that have a 'value' property (from cvToValue)
  if (typeof val === 'object' && val !== null && 'value' in val) {
    return (val as { value: unknown }).value;
  }
  
  return val;
}

/**
 * Safely convert to BigInt, handling objects and various types
 */
function toBigInt(val: unknown): bigint {
  const extracted = extractValue(val);
  if (typeof extracted === 'bigint') return extracted;
  if (typeof extracted === 'number') return BigInt(Math.floor(extracted));
  if (typeof extracted === 'string') return BigInt(extracted);
  console.warn('[toBigInt] Unexpected type:', typeof extracted, extracted);
  return 0n;
}

/**
 * Safely convert to Number, handling objects and various types
 */
function toNumber(val: unknown): number {
  const extracted = extractValue(val);
  if (typeof extracted === 'number') return extracted;
  if (typeof extracted === 'bigint') return Number(extracted);
  if (typeof extracted === 'string') return parseInt(extracted, 10);
  console.warn('[toNumber] Unexpected type:', typeof extracted, extracted);
  return 0;
}

/**
 * Parse a Clarity tuple response into StreamData
 */
function parseStreamData(cv: ClarityValue): StreamData | null {
  if (cv.type === ClarityType.OptionalNone) {
    return null;
  }

  const value = cv.type === ClarityType.OptionalSome ? cv.value : cv;
  
  if (value.type !== ClarityType.Tuple) {
    return null;
  }

  const data = cvToValue(value);
  console.log('[parseStreamData] Raw data:', data);
  
  return {
    sender: String(extractValue(data.sender) || ''),
    recipient: String(extractValue(data.recipient) || ''),
    totalAmount: toBigInt(data['total-amount']),
    withdrawn: toBigInt(data.withdrawn),
    startBlock: toNumber(data['start-block']),
    endBlock: toNumber(data['end-block']),
    active: Boolean(extractValue(data.active)),
  };
}

/**
 * Parse a Clarity response (ok/err) to get the inner value
 * Handles nested value objects from cvToValue
 */
function parseResponse<T>(cv: ClarityValue): T {
  const value = cvToValue(cv);
  
  // If it's a response type, extract the value
  if (typeof value === 'object' && value !== null) {
    if ('value' in value) {
      const inner = (value as { value: unknown }).value;
      // Check if inner value also has a 'value' property (double-wrapped)
      if (typeof inner === 'object' && inner !== null && 'value' in inner) {
        return (inner as { value: unknown }).value as T;
      }
      return inner as T;
    }
  }
  
  return value as T;
}

/**
 * Parse a Clarity response and convert to bigint safely
 */
function parseResponseBigInt(cv: ClarityValue): bigint {
  const value = parseResponse<unknown>(cv);
  return toBigInt(value);
}

/**
 * Parse a Clarity response and convert to number safely
 */
function parseResponseNumber(cv: ClarityValue): number {
  const value = parseResponse<unknown>(cv);
  return toNumber(value);
}

/**
 * Call a read-only function on the drip-core contract
 */
async function callReadOnly(
  functionName: string, 
  functionArgs: ClarityValue[], 
  senderAddress: string
): Promise<ClarityValue> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DRIP_CONTRACT.address,
      contractName: DRIP_CONTRACT.name,
      functionName,
      functionArgs,
      senderAddress,
      network: NETWORK_STRING,
    });
    return result;
  } catch (error) {
    console.error(`[Contract] Error calling ${functionName}:`, error);
    throw error;
  }
}

/**
 * Parse a Clarity list of uint values into JavaScript numbers
 * Handles various edge cases from different SDK versions
 */
function parseUintList(cv: ClarityValue): number[] {
  console.log('[parseUintList] Input type:', cv.type);
  
  // If it's a list type, extract values using cvToValue for proper typing
  if (cv.type === ClarityType.List) {
    // Use cvToValue to properly decode the list - it handles type conversion
    const listValue = cvToValue(cv);
    if (Array.isArray(listValue)) {
      const parsed = listValue.map((item: unknown) => {
        // cvToValue returns objects like {type: 'uint', value: '0'}
        if (typeof item === 'object' && item !== null && 'value' in item) {
          const val = (item as { value: unknown }).value;
          if (typeof val === 'string') return parseInt(val, 10);
          if (typeof val === 'bigint') return Number(val);
          if (typeof val === 'number') return Math.floor(val);
        }
        if (typeof item === 'bigint') return Number(item);
        if (typeof item === 'number') return Math.floor(item);
        console.warn('[parseUintList] Non-uint item in list:', item);
        return NaN;
      }).filter((n: number) => !isNaN(n) && n >= 0);
      console.log('[parseUintList] Parsed from List:', parsed);
      return parsed;
    }
  }
  
  // Fallback to cvToValue for other cases
  const value = cvToValue(cv);
  console.log('[parseUintList] cvToValue result:', value);
  
  if (!Array.isArray(value)) {
    console.warn('[parseUintList] Expected array, got:', typeof value, value);
    return [];
  }
  
  const parsed = value.map(id => {
    // Handle bigint
    if (typeof id === 'bigint') return Number(id);
    // Handle number
    if (typeof id === 'number') return Math.floor(id);
    // Handle string
    if (typeof id === 'string') return parseInt(id, 10);
    // Handle object with value property
    if (typeof id === 'object' && id !== null && 'value' in id) {
      return Number(id.value);
    }
    console.warn('[parseUintList] Unknown id type:', typeof id, id);
    return NaN;
  }).filter(n => !isNaN(n) && n >= 0);
  
  console.log('[parseUintList] Parsed via fallback:', parsed);
  return parsed;
}

// ============================================
// Stream Read Functions
// ============================================

/**
 * Get a single stream by ID
 */
export async function getStream(
  streamId: number, 
  senderAddress: string
): Promise<StreamData | null> {
  const result = await callReadOnly(
    'get-stream',
    [Cl.uint(streamId)],
    senderAddress
  );
  
  return parseStreamData(result);
}

/**
 * Get the vested (unlocked) amount for a stream
 */
export async function getVested(
  streamId: number, 
  senderAddress: string
): Promise<bigint> {
  const result = await callReadOnly(
    'get-vested',
    [Cl.uint(streamId)],
    senderAddress
  );
  
  return parseResponseBigInt(result);
}

/**
 * Get the withdrawable amount for a stream (vested - withdrawn)
 */
export async function getWithdrawable(
  streamId: number, 
  senderAddress: string
): Promise<bigint> {
  const result = await callReadOnly(
    'get-withdrawable',
    [Cl.uint(streamId)],
    senderAddress
  );
  
  return parseResponseBigInt(result);
}

/**
 * Get stream progress as percentage (0-100)
 */
export async function getStreamProgress(
  streamId: number, 
  senderAddress: string
): Promise<number> {
  const result = await callReadOnly(
    'get-stream-progress',
    [Cl.uint(streamId)],
    senderAddress
  );
  
  return parseResponseNumber(result);
}

/**
 * Get all outgoing stream IDs for a user
 */
export async function getOutgoingStreamIds(
  userAddress: string
): Promise<number[]> {
  const result = await callReadOnly(
    'get-outgoing-streams',
    [Cl.principal(userAddress)],
    userAddress
  );
  
  return parseUintList(result);
}

/**
 * Get all incoming stream IDs for a user
 */
export async function getIncomingStreamIds(
  userAddress: string
): Promise<number[]> {
  const result = await callReadOnly(
    'get-incoming-streams',
    [Cl.principal(userAddress)],
    userAddress
  );
  
  return parseUintList(result);
}

/**
 * Get total number of streams created
 */
export async function getStreamCount(
  senderAddress: string
): Promise<number> {
  const result = await callReadOnly(
    'get-stream-count',
    [],
    senderAddress
  );
  
  const count = cvToValue(result);
  return Number(count);
}

/**
 * Get full stream details with computed fields
 */
export async function getFullStreamDetails(
  streamId: number,
  senderAddress: string
): Promise<ParsedStream | null> {
  const [stream, vested, withdrawable, progress] = await Promise.all([
    getStream(streamId, senderAddress),
    getVested(streamId, senderAddress),
    getWithdrawable(streamId, senderAddress),
    getStreamProgress(streamId, senderAddress),
  ]);

  if (!stream) return null;

  return {
    id: streamId,
    ...stream,
    tokenType: 'sBTC' as const,
    vested,
    withdrawable,
    progress,
  };
}

/**
 * Get all streams for a user (both incoming and outgoing) with full details
 */
export async function getAllUserStreams(userAddress: string): Promise<{
  outgoing: ParsedStream[];
  incoming: ParsedStream[];
}> {
  // Get stream IDs
  const [outgoingIds, incomingIds] = await Promise.all([
    getOutgoingStreamIds(userAddress),
    getIncomingStreamIds(userAddress),
  ]);

  // Fetch full details for all streams
  const [outgoing, incoming] = await Promise.all([
    Promise.all(outgoingIds.map(id => getFullStreamDetails(id, userAddress))),
    Promise.all(incomingIds.map(id => getFullStreamDetails(id, userAddress))),
  ]);

  return {
    outgoing: outgoing.filter((s): s is ParsedStream => s !== null),
    incoming: incoming.filter((s): s is ParsedStream => s !== null),
  };
}

// ============================================
// Balance & Account Functions
// ============================================

/**
 * Get sBTC balance for an address using Hiro API
 */
export async function getSbtcBalance(address: string): Promise<bigint> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/extended/v1/address/${address}/balances`
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch sBTC balance:', response.status);
      return 0n;
    }
    
    const data = await response.json();
    
    // Look for sBTC in fungible tokens
    const sbtcKey = `${SBTC_CONTRACT.principal}::${SBTC_CONTRACT.assetName}`;
    const sbtcBalance = data.fungible_tokens?.[sbtcKey]?.balance;
    
    if (sbtcBalance) {
      return BigInt(sbtcBalance);
    }
    
    return 0n;
  } catch (error) {
    console.error('Error fetching sBTC balance:', error);
    return 0n;
  }
}

/**
 * Get STX balance for an address using Hiro API
 */
export async function getStxBalance(address: string): Promise<bigint> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/extended/v1/address/${address}/stx`
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch STX balance:', response.status);
      return 0n;
    }
    
    const data = await response.json();
    return BigInt(data.balance || '0');
  } catch (error) {
    console.error('Error fetching STX balance:', error);
    return 0n;
  }
}

/**
 * Get both STX and sBTC balances
 */
export async function getBalances(address: string): Promise<{
  stx: bigint;
  sbtc: bigint;
}> {
  const [stx, sbtc] = await Promise.all([
    getStxBalance(address),
    getSbtcBalance(address),
  ]);
  
  return { stx, sbtc };
}

/**
 * Get current block height from Hiro API
 */
export async function getCurrentBlockHeight(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/v2/info`);
    
    if (!response.ok) {
      console.warn('Failed to fetch block height:', response.status);
      return 0;
    }
    
    const data = await response.json();
    return Number(data.stacks_tip_height || 0);
  } catch (error) {
    console.error('Error fetching block height:', error);
    return 0;
  }
}

// ============================================
// STX Stream Read Functions
// ============================================

/**
 * Ensure a value is a valid integer for Cl.uint
 */
function ensureInteger(value: number, context: string): number {
  if (!Number.isInteger(value) || value < 0) {
    console.error(`[${context}] Invalid integer value:`, value);
    throw new Error(`Invalid stream ID: ${value} (must be non-negative integer)`);
  }
  return value;
}

/**
 * Get a single STX stream by ID
 */
export async function getStxStream(
  streamId: number, 
  senderAddress: string
): Promise<StreamData | null> {
  const safeId = ensureInteger(streamId, 'getStxStream');
  const result = await callReadOnly(
    'get-stx-stream',
    [Cl.uint(safeId)],
    senderAddress
  );
  
  return parseStreamData(result);
}

/**
 * Get the vested (unlocked) amount for an STX stream
 */
export async function getStxVested(
  streamId: number, 
  senderAddress: string
): Promise<bigint> {
  const safeId = ensureInteger(streamId, 'getStxVested');
  const result = await callReadOnly(
    'get-stx-vested',
    [Cl.uint(safeId)],
    senderAddress
  );
  
  return parseResponseBigInt(result);
}

/**
 * Get the withdrawable amount for an STX stream (vested - withdrawn)
 */
export async function getStxWithdrawable(
  streamId: number, 
  senderAddress: string
): Promise<bigint> {
  const safeId = ensureInteger(streamId, 'getStxWithdrawable');
  const result = await callReadOnly(
    'get-stx-withdrawable',
    [Cl.uint(safeId)],
    senderAddress
  );
  
  return parseResponseBigInt(result);
}

/**
 * Get STX stream progress as percentage (0-100)
 */
export async function getStxStreamProgress(
  streamId: number, 
  senderAddress: string
): Promise<number> {
  const safeId = ensureInteger(streamId, 'getStxStreamProgress');
  const result = await callReadOnly(
    'get-stx-stream-progress',
    [Cl.uint(safeId)],
    senderAddress
  );
  
  return parseResponseNumber(result);
}

/**
 * Get all outgoing STX stream IDs for a user
 */
export async function getStxOutgoingStreamIds(
  userAddress: string
): Promise<number[]> {
  const result = await callReadOnly(
    'get-stx-outgoing-streams',
    [Cl.principal(userAddress)],
    userAddress
  );
  
  return parseUintList(result);
}

/**
 * Get all incoming STX stream IDs for a user
 */
export async function getStxIncomingStreamIds(
  userAddress: string
): Promise<number[]> {
  const result = await callReadOnly(
    'get-stx-incoming-streams',
    [Cl.principal(userAddress)],
    userAddress
  );
  
  return parseUintList(result);
}

/**
 * Get total number of STX streams created
 */
export async function getStxStreamCount(
  senderAddress: string
): Promise<number> {
  const result = await callReadOnly(
    'get-stx-stream-count',
    [],
    senderAddress
  );
  
  const count = cvToValue(result);
  return Number(count);
}

/**
 * Get full STX stream details with computed fields
 */
export async function getFullStxStreamDetails(
  streamId: number,
  senderAddress: string
): Promise<ParsedStream | null> {
  const [stream, vested, withdrawable, progress] = await Promise.all([
    getStxStream(streamId, senderAddress),
    getStxVested(streamId, senderAddress),
    getStxWithdrawable(streamId, senderAddress),
    getStxStreamProgress(streamId, senderAddress),
  ]);

  if (!stream) return null;

  return {
    id: streamId,
    ...stream,
    tokenType: 'STX' as const,
    vested,
    withdrawable,
    progress,
  };
}

/**
 * Get all STX streams for a user (both incoming and outgoing) with full details
 */
export async function getAllUserStxStreams(userAddress: string): Promise<{
  outgoing: ParsedStream[];
  incoming: ParsedStream[];
}> {
  // Get stream IDs
  const [outgoingIds, incomingIds] = await Promise.all([
    getStxOutgoingStreamIds(userAddress),
    getStxIncomingStreamIds(userAddress),
  ]);

  // Fetch full details for all streams
  const [outgoing, incoming] = await Promise.all([
    Promise.all(outgoingIds.map(id => getFullStxStreamDetails(id, userAddress))),
    Promise.all(incomingIds.map(id => getFullStxStreamDetails(id, userAddress))),
  ]);

  return {
    outgoing: outgoing.filter((s): s is ParsedStream => s !== null),
    incoming: incoming.filter((s): s is ParsedStream => s !== null),
  };
}
