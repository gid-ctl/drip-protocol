import { API_BASE_URL } from "./config";

/**
 * Resolve a BNS name to its Stacks address
 * @param bnsName - The BNS name (e.g., "satoshi.btc")
 * @returns The Stacks address or null if not found
 */
export async function resolveBns(bnsName: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/names/${encodeURIComponent(bnsName)}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.address || null;
  } catch (error) {
    console.error("BNS resolution error:", error);
    return null;
  }
}

/**
 * Get BNS names owned by an address (reverse lookup)
 * @param address - The Stacks address
 * @returns The primary BNS name or null if none found
 */
export async function reverseBns(address: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/addresses/stacks/${encodeURIComponent(address)}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    // Returns array of names owned by this address
    if (data.names && data.names.length > 0) {
      return data.names[0]; // Return primary/first name
    }
    return null;
  } catch (error) {
    console.error("Reverse BNS lookup error:", error);
    return null;
  }
}

// Local storage key for recent recipients
const RECENT_RECIPIENTS_KEY = "drip-recent-recipients";

export interface RecentRecipient {
  address: string;
  label: string;
  lastUsed: number;
}

/**
 * Get recent recipients from local storage
 */
export function getRecentRecipients(): RecentRecipient[] {
  try {
    const stored = localStorage.getItem(RECENT_RECIPIENTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Add a recipient to recent list
 */
export function addRecentRecipient(address: string, label?: string): void {
  try {
    const recipients = getRecentRecipients();
    
    // Remove if already exists
    const filtered = recipients.filter((r) => r.address !== address);
    
    // Add at the beginning
    filtered.unshift({
      address,
      label: label || `${address.slice(0, 8)}...${address.slice(-4)}`,
      lastUsed: Date.now(),
    });
    
    // Keep only last 5
    const trimmed = filtered.slice(0, 5);
    
    localStorage.setItem(RECENT_RECIPIENTS_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}
