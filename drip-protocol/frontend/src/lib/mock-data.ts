export type StreamStatus = "active" | "completed" | "cancelled";
export type StreamDirection = "outgoing" | "incoming";

export interface Stream {
  id: string;
  sender: string;
  recipient: string;
  totalAmount: number;
  vestedAmount: number;
  withdrawnAmount: number;
  direction: StreamDirection;
  status: StreamStatus;
  startBlock: number;
  endBlock: number;
  currentBlock: number;
  createdAt: string;
  durationDays: number;
}

export interface Transaction {
  id: string;
  streamId: string;
  type: "created" | "withdrawn" | "cancelled";
  amount: number;
  txHash: string;
  timestamp: string;
  blockHeight: number;
}

export const MOCK_BTC_USD = 97500;

const USER_ADDRESS = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQYAC0D";

export const mockStreams: Stream[] = [
  {
    id: "1",
    sender: USER_ADDRESS,
    recipient: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    totalAmount: 0.5,
    vestedAmount: 0.18,
    withdrawnAmount: 0.1,
    direction: "outgoing",
    status: "active",
    startBlock: 150000,
    endBlock: 154320,
    currentBlock: 151555,
    createdAt: "2026-02-10T14:30:00Z",
    durationDays: 30,
  },
  {
    id: "2",
    sender: "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE",
    recipient: USER_ADDRESS,
    totalAmount: 1.2,
    vestedAmount: 0.85,
    withdrawnAmount: 0.6,
    direction: "incoming",
    status: "active",
    startBlock: 148000,
    endBlock: 156640,
    currentBlock: 153200,
    createdAt: "2026-01-25T09:15:00Z",
    durationDays: 60,
  },
  {
    id: "3",
    sender: USER_ADDRESS,
    recipient: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
    totalAmount: 0.25,
    vestedAmount: 0.09,
    withdrawnAmount: 0.0,
    direction: "outgoing",
    status: "active",
    startBlock: 151000,
    endBlock: 153016,
    currentBlock: 151725,
    createdAt: "2026-02-15T18:00:00Z",
    durationDays: 14,
  },
  {
    id: "4",
    sender: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KR9D",
    recipient: USER_ADDRESS,
    totalAmount: 0.1,
    vestedAmount: 0.1,
    withdrawnAmount: 0.1,
    direction: "incoming",
    status: "completed",
    startBlock: 140000,
    endBlock: 141008,
    currentBlock: 151555,
    createdAt: "2025-12-01T12:00:00Z",
    durationDays: 7,
  },
  {
    id: "5",
    sender: USER_ADDRESS,
    recipient: "SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS",
    totalAmount: 2.0,
    vestedAmount: 0.4,
    withdrawnAmount: 0.0,
    direction: "outgoing",
    status: "cancelled",
    startBlock: 145000,
    endBlock: 158024,
    currentBlock: 146200,
    createdAt: "2025-12-20T08:45:00Z",
    durationDays: 90,
  },
];

export const mockTransactions: Transaction[] = [
  { id: "t1", streamId: "1", type: "created", amount: 0.5, txHash: "0xabc123def456789012345678901234567890abcd", timestamp: "2026-02-10T14:30:00Z", blockHeight: 150000 },
  { id: "t2", streamId: "1", type: "withdrawn", amount: 0.1, txHash: "0xdef456789012345678901234567890abcdef1234", timestamp: "2026-02-16T10:00:00Z", blockHeight: 150865 },
  { id: "t3", streamId: "2", type: "created", amount: 1.2, txHash: "0x789012345678901234567890abcdef1234567890", timestamp: "2026-01-25T09:15:00Z", blockHeight: 148000 },
  { id: "t4", streamId: "2", type: "withdrawn", amount: 0.3, txHash: "0x345678901234567890abcdef123456789012abcd", timestamp: "2026-02-05T15:20:00Z", blockHeight: 149600 },
  { id: "t5", streamId: "2", type: "withdrawn", amount: 0.3, txHash: "0x901234567890abcdef12345678901234abcdef56", timestamp: "2026-02-18T11:30:00Z", blockHeight: 152400 },
  { id: "t6", streamId: "4", type: "created", amount: 0.1, txHash: "0xabcdef1234567890abcdef1234567890abcdef12", timestamp: "2025-12-01T12:00:00Z", blockHeight: 140000 },
  { id: "t7", streamId: "4", type: "withdrawn", amount: 0.1, txHash: "0x567890abcdef1234567890abcdef123456789012", timestamp: "2025-12-08T14:00:00Z", blockHeight: 141008 },
  { id: "t8", streamId: "5", type: "created", amount: 2.0, txHash: "0xcdef1234567890abcdef1234567890abcdef1234", timestamp: "2025-12-20T08:45:00Z", blockHeight: 145000 },
  { id: "t9", streamId: "5", type: "cancelled", amount: 1.6, txHash: "0x1234567890abcdef1234567890abcdef12345678", timestamp: "2026-01-05T16:30:00Z", blockHeight: 146200 },
  { id: "t10", streamId: "1", type: "withdrawn", amount: 0.05, txHash: "0xaa11bb22cc33dd44ee55ff6677889900aabb1122", timestamp: "2026-02-12T08:00:00Z", blockHeight: 150290 },
  { id: "t11", streamId: "1", type: "withdrawn", amount: 0.03, txHash: "0xbb22cc33dd44ee55ff6677889900aabb11223344", timestamp: "2026-02-18T14:20:00Z", blockHeight: 151150 },
  { id: "t12", streamId: "2", type: "withdrawn", amount: 0.15, txHash: "0xcc33dd44ee55ff6677889900aabb112233445566", timestamp: "2026-02-10T11:45:00Z", blockHeight: 150800 },
  { id: "t13", streamId: "2", type: "withdrawn", amount: 0.1, txHash: "0xdd44ee55ff6677889900aabb11223344556677aa", timestamp: "2026-02-20T09:30:00Z", blockHeight: 153800 },
  { id: "t14", streamId: "3", type: "created", amount: 0.25, txHash: "0xee55ff6677889900aabb11223344556677aabb88", timestamp: "2026-02-15T18:00:00Z", blockHeight: 151000 },
  { id: "t15", streamId: "3", type: "withdrawn", amount: 0.04, txHash: "0xff6677889900aabb11223344556677aabb8899cc", timestamp: "2026-02-17T22:10:00Z", blockHeight: 151300 },
  { id: "t16", streamId: "3", type: "withdrawn", amount: 0.05, txHash: "0x6677889900aabb11223344556677aabb8899ccdd", timestamp: "2026-02-19T07:55:00Z", blockHeight: 151600 },
  { id: "t17", streamId: "1", type: "withdrawn", amount: 0.02, txHash: "0x77889900aabb11223344556677aabb8899ccddee", timestamp: "2026-02-20T16:40:00Z", blockHeight: 151800 },
  { id: "t18", streamId: "4", type: "withdrawn", amount: 0.03, txHash: "0x889900aabb11223344556677aabb8899ccddeeff", timestamp: "2025-12-03T10:30:00Z", blockHeight: 140300 },
  { id: "t19", streamId: "4", type: "withdrawn", amount: 0.04, txHash: "0x9900aabb11223344556677aabb8899ccddeeff00", timestamp: "2025-12-05T16:15:00Z", blockHeight: 140600 },
  { id: "t20", streamId: "4", type: "withdrawn", amount: 0.03, txHash: "0x00aabb11223344556677aabb8899ccddeeff0011", timestamp: "2025-12-07T09:00:00Z", blockHeight: 140900 },
  { id: "t21", streamId: "5", type: "withdrawn", amount: 0.2, txHash: "0xaabb11223344556677aabb8899ccddeeff001122", timestamp: "2025-12-22T14:00:00Z", blockHeight: 145300 },
  { id: "t22", streamId: "5", type: "withdrawn", amount: 0.2, txHash: "0xbb11223344556677aabb8899ccddeeff00112233", timestamp: "2025-12-28T11:30:00Z", blockHeight: 145800 },
  { id: "t23", streamId: "1", type: "created", amount: 0.5, txHash: "0x11223344556677aabb8899ccddeeff0011223344", timestamp: "2026-02-10T14:30:00Z", blockHeight: 150000 },
  { id: "t24", streamId: "2", type: "created", amount: 1.2, txHash: "0x223344556677aabb8899ccddeeff001122334455", timestamp: "2026-01-25T09:15:00Z", blockHeight: 148000 },
  { id: "t25", streamId: "3", type: "cancelled", amount: 0.16, txHash: "0x3344556677aabb8899ccddeeff00112233445566", timestamp: "2026-02-21T13:00:00Z", blockHeight: 151900 },
  { id: "t26", streamId: "1", type: "withdrawn", amount: 0.07, txHash: "0x44556677aabb8899ccddeeff0011223344556677", timestamp: "2026-02-14T19:25:00Z", blockHeight: 150600 },
  { id: "t27", streamId: "2", type: "cancelled", amount: 0.35, txHash: "0x556677aabb8899ccddeeff00112233445566aabb", timestamp: "2026-02-22T08:00:00Z", blockHeight: 154000 },
  { id: "t28", streamId: "5", type: "created", amount: 2.0, txHash: "0x6677aabb8899ccddeeff00112233445566aabbcc", timestamp: "2025-12-20T08:45:00Z", blockHeight: 145000 },
  { id: "t29", streamId: "3", type: "cancelled", amount: 0.11, txHash: "0x77aabb8899ccddeeff00112233445566aabbccdd", timestamp: "2026-02-20T20:00:00Z", blockHeight: 151750 },
  { id: "t30", streamId: "2", type: "withdrawn", amount: 0.08, txHash: "0xaabb8899ccddeeff00112233445566aabbccddee", timestamp: "2026-02-15T06:10:00Z", blockHeight: 151050 },
];

export function getProgress(stream: Stream): number {
  if (stream.status === "completed") return 100;
  if (stream.status === "cancelled") {
    const total = stream.endBlock - stream.startBlock;
    const elapsed = stream.currentBlock - stream.startBlock;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }
  const total = stream.endBlock - stream.startBlock;
  const elapsed = stream.currentBlock - stream.startBlock;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function getTimeLeft(stream: Stream): string {
  if (stream.status === "completed") return "Completed";
  if (stream.status === "cancelled") return "Cancelled";
  const blocksLeft = stream.endBlock - stream.currentBlock;
  if (blocksLeft <= 0) return "Completed";
  // ~10 min per block on Stacks
  const minutesLeft = blocksLeft * 10;
  const days = Math.floor(minutesLeft / 1440);
  const hours = Math.floor((minutesLeft % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return `${minutesLeft}m left`;
}

export function getWithdrawable(stream: Stream): number {
  return Math.max(0, stream.vestedAmount - stream.withdrawnAmount);
}

export function getRemaining(stream: Stream): number {
  return Math.max(0, stream.totalAmount - stream.vestedAmount);
}

export function getDailyRate(stream: Stream): number {
  if (stream.durationDays === 0) return 0;
  return stream.totalAmount / stream.durationDays;
}

export function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getStreamById(id: string): Stream | undefined {
  return mockStreams.find((s) => s.id === id);
}

export function getTransactionsForStream(streamId: string): Transaction[] {
  return mockTransactions.filter((t) => t.streamId === streamId);
}

// BNS (Bitcoin Name Service) mock registry
export const mockBnsNames: Record<string, string> = {
  "alice.btc": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
  "bob.btc": "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
  "carol.btc": "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE",
  "dave.btc": "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KR9D",
};

/** Resolve a .btc name to a Stacks address (simulated 500ms delay) */
export async function resolveBns(name: string): Promise<string | null> {
  await new Promise((r) => setTimeout(r, 500));
  const lower = name.toLowerCase();
  return mockBnsNames[lower] ?? null;
}

/** Reverse-lookup: get the BNS name for a Stacks address, if one exists */
export function reverseBns(address: string): string | null {
  for (const [name, addr] of Object.entries(mockBnsNames)) {
    if (addr === address) return name;
  }
  return null;
}

export interface RecentRecipient {
  label: string;
  address: string;
}

export const recentRecipients: RecentRecipient[] = [
  { label: "alice.btc", address: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE" },
  { label: "bob.btc", address: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS" },
];
