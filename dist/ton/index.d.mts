import * as _tonconnect_ui0 from "@tonconnect/ui";
import { TonProofItemReply, Wallet as Wallet$1 } from "@tonconnect/ui";

//#region src/types.d.ts
/**
 * TON Wallet connection status
 */
declare enum TonWalletStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}
/**
 * TON Wallet account information
 */
interface TonWalletAccount {
  /** Wallet address */
  address: string;
  /** Wallet public key */
  publicKey?: string;
  /** TON chain ID (-239 mainnet, -3 testnet) */
  chainId?: string | number;
}
/**
 * TON transaction parameters interface
 */
interface TonTransactionParams {
  /** Recipient address */
  to: string;
  /** Amount to send (nanoTON) */
  amount: string;
  /** Message payload */
  payload?: string;
  /** Valid until (Unix timestamp) */
  validUntil?: number;
  /** Whether to use the message body as a Cell */
  stateInit?: string;
  /** Custom parameters */
  [key: string]: unknown;
}
/**
 * TON Jetton token transaction parameters
 */
interface TonJettonTransactionParams extends TonTransactionParams {
  /** Jetton master contract address */
  jettonMasterAddress: string;
  /** Jetton decimals */
  decimals?: number;
  /** Forwarded TON amount */
  forwardAmount?: string;
}
/**
 * TON wallet status change handler
 */
type TonWalletStatusChangeHandler = (status: TonWalletStatus, account?: TonWalletAccount | null) => void;
//# sourceMappingURL=types.d.ts.map
//#endregion
//#region src/index.d.ts
/**
 * Extend WalletAccount with a human-readable address
 */
interface WalletAccount extends TonWalletAccount {
  /** Human-readable format address */
  addressUserFriendly?: string;
}
interface JettonWalletInfo {
  address: string;
  decimals: number;
}
declare class Wallet {
  /** TonConnect UI instance */
  private tonConnectUI;
  /** Singleton instance */
  private static instance;
  /** Wallet connection status */
  private _status;
  /** Current connected account info */
  private _account;
  /** Set of status change listeners */
  private statusChangeHandlers;
  /** Cache for Jetton wallet addresses */
  private jettonWalletCache;
  /** Unsubscribe function for TonConnect status changes */
  private _tonConnectStatusUnsubscribe?;
  /**
   * Constructor
   * @param options TON wallet configuration options
   */
  private constructor();
  /**
   * Get the singleton Wallet instance
   * @param manifestUrl TON Connect manifest URL
   * @returns Wallet instance
   */
  static getInstance(manifestUrl: string): Wallet;
  /**
   * Detect if the device is iOS
   * @returns true if iOS device
   */
  private isIOSDevice;
  /**
   * Handle TonConnect status change event
   * @param wallet Wallet status info
   */
  private handleTonConnectStatusChange;
  /**
   * Destroy the current instance (legacy API)
   * @deprecated Please call the instance's destroy() method directly
   */
  static destroy(): void;
  /** Get wallet connection status */
  get status(): TonWalletStatus;
  /** Get current connected account info */
  get account(): WalletAccount | null;
  /** Check if wallet is connected */
  get connected(): boolean;
  /**
   * Get raw TonConnect wallet instance
   * @returns Current connected wallet instance or undefined if disconnected
   */
  get wallet(): Wallet$1 | (Wallet$1 & _tonconnect_ui0.WalletInfoWithOpenMethod) | null;
  /**
   * Get current connected TonConnect account info
   * @returns Current connected account info or undefined if disconnected
   */
  get tonAccount(): _tonconnect_ui0.Account | null;
  /**
   * Get current connected wallet address
   * @returns Wallet address or undefined if disconnected
   */
  get address(): string | undefined;
  /**
   * Get current wallet address in human-readable format (non-bounceable, consistent with wallet UI)
   * @returns Human-readable address (e.g. UQ... / KQ...)
   */
  get addressUserFriendly(): string | undefined;
  /**
   * Update wallet status
   * @param status New status
   * @param account Account info
   */
  private updateStatus;
  /**
   * Notify all listeners of status change
   * @param status New status
   * @param account Account info
   */
  private notifyStatusChange;
  /**
   * Get TON Proof
   * @returns TON Proof data or null if not available
   */
  getTonProof(): TonProofItemReply | null;
  /**
   * Listen for TonConnect wallet connection status changes
   * @param handler Listener function with WalletStatus and WalletAccount parameters
   * @returns Unsubscribe function
   */
  onStatusChange(handler: (status: TonWalletStatus, account?: WalletAccount | null) => void): () => void;
  /**
   * Destroy wallet instance
   */
  destroy(): void;
  /**
   * Connect to wallet
   * @returns Whether the connection was successful
   */
  connect(): Promise<boolean>;
  /**
   * Disconnect wallet
   */
  disconnect(): Promise<void>;
  /**
   * Send TON transaction
   * @param to Recipient address
   * @param amount Amount to send (TON)
   * @param message Optional message content
   * @returns Transaction hash
   */
  sendTransaction(to: string, amount: number, message?: string): Promise<string>;
  /**
   * Send JETTON token transaction
   * @param jettonMasterAddress JETTON master contract address
   * @param to Recipient address
   * @param amount Amount to send (human-readable, auto converted to smallest unit)
   * @param message Optional message content
   * @param gasAmount Optional gas fee (TON), default 0.1
   * @returns Transaction hash
   */
  sendJettonTransaction(jettonMasterAddress: string, to: string, amount: number, message?: string): Promise<string>;
  /**
   * Get current network type
   * @returns 'mainnet' | 'testnet'
   */
  getNetwork(): 'mainnet' | 'testnet';
  /**
   * Get the Jetton wallet address
   * @param jettonMasterAddress Jetton master contract address
   * @param ownerAddress User wallet address
   * @returns Jetton wallet address info
   */
  calculateJettonWalletAddress(jettonMasterAddress: string, ownerAddress: string): Promise<JettonWalletInfo>;
  /**
   * @deprecated Please use onStatusChange(handler) instead. This method will be removed in future versions.
   * Add a custom status change listener (not recommended for new projects)
   */
  addStatusChangeListener(handler: (status: TonWalletStatus, account?: WalletAccount | null) => void): void;
  /**
   * @deprecated Please use the unsubscribe function returned by onStatusChange(handler) instead. This method will be removed in future versions.
   * Remove a custom status change listener (not recommended for new projects)
   */
  removeStatusChangeListener(handler: (status: TonWalletStatus, account?: WalletAccount | null) => void): void;
}
//#endregion
export { TonJettonTransactionParams, TonTransactionParams, TonWalletAccount, TonWalletStatus, TonWalletStatusChangeHandler, Wallet, WalletAccount };
//# sourceMappingURL=index.d.mts.map