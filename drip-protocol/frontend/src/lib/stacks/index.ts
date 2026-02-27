/**
 * DRIP Protocol - Stacks Integration
 * 
 * Re-exports all Stacks-related functionality.
 */

// Configuration
export {
  NETWORK,
  NETWORK_STRING,
  API_BASE_URL,
  DRIP_CONTRACT,
  SBTC_CONTRACT,
  EXPLORER_BASE_URL,
  TESTNET_FAUCET_URL,
  CONTRACT_ERRORS,
  getErrorMessage,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  getExplorerContractUrl,
  explorerTxUrl,
  // Block time utilities
  BLOCKS_PER_DAY,
  BLOCKS_PER_WEEK,
  BLOCKS_PER_MONTH,
  blocksToSeconds,
  blocksToDays,
  blocksToApproxDays,
  daysToBlocks,
  // Formatting
  SBTC_DECIMALS,
  satsToSbtc,
  sbtcToSats,
  formatSbtc,
  STX_DECIMALS,
  microStxToStx,
  stxToMicroStx,
  formatStx,
  formatAddress,
  // Token utilities
  type TokenType,
  TOKEN_CONFIG,
  toSmallestUnit,
  fromSmallestUnit,
  formatTokenAmount,
  // Polling intervals
  BALANCE_POLL_INTERVAL,
  STREAM_POLL_INTERVAL,
  TX_POLL_INTERVAL,
  TX_CONFIRMATION_TIMEOUT,
  MAX_TX_TRACK_ATTEMPTS,
  // Error handling (per Stacks docs)
  parseWalletError,
  validateStacksAddress,
  type TxStatus,
} from './config';

// Read functions
export {
  type StreamData,
  type ParsedStream,
  // sBTC stream functions
  getStream,
  getVested,
  getWithdrawable,
  getStreamProgress,
  getOutgoingStreamIds,
  getIncomingStreamIds,
  getStreamCount,
  getFullStreamDetails,
  getAllUserStreams,
  // STX stream functions
  getStxStream,
  getStxVested,
  getStxWithdrawable,
  getStxStreamProgress,
  getStxOutgoingStreamIds,
  getStxIncomingStreamIds,
  getStxStreamCount,
  getFullStxStreamDetails,
  getAllUserStxStreams,
  // Balance functions
  getSbtcBalance,
  getStxBalance,
  getBalances,
  getCurrentBlockHeight,
} from './read';

// Write functions
export {
  type TransactionResult,
  type CreateStreamParams,
  type WithdrawParams,
  type CancelStreamParams,
  type TxInfo,
  createStream,
  withdraw,
  cancelStream,
  trackTransaction,
  getTxExplorerUrl,
  isValidStacksAddress,
  validateCreateStreamParams,
} from './write';

// BNS utilities
export {
  type RecentRecipient,
  resolveBns,
  reverseBns,
  getRecentRecipients,
  addRecentRecipient,
} from './bns';
