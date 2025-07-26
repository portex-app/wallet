import { AbiItem, Contract, EIP1193Provider } from "web3";

//#region src/types.d.ts
/**
 * Ethereum wallet connection status
 */
declare enum EthWalletStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}
/**
 * Ethereum wallet account information
 */
interface EthWalletAccount {
  /** Wallet address */
  address: string;
  /** Wallet public key (less commonly used in Ethereum) */
  publicKey?: string;
  /** Ethereum chain ID */
  chainId?: string | number;
}
/**
 * Ethereum transaction parameters interface
 */
interface EthTransactionParams {
  /** Recipient address */
  to: string;
  /** Amount to send */
  amount: string;
  /** Transaction data */
  data?: string;
  /** Gas limit */
  gasLimit?: string;
  /** Gas price */
  gasPrice?: string;
  /** EIP-1559 max fee per gas */
  maxFeePerGas?: string;
  /** EIP-1559 max priority fee per gas */
  maxPriorityFeePerGas?: string;
  /** Nonce */
  nonce?: number;
  /** Custom parameters */
  [key: string]: unknown;
}
/**
 * Ethereum wallet status change listener
 */
type EthWalletStatusChangeHandler = (status: EthWalletStatus, account?: EthWalletAccount | null) => void;
//# sourceMappingURL=types.d.ts.map
//#endregion
//#region src/index.d.ts
declare global {
  interface Window {
    ethereum?: EIP1193Provider<unknown>;
  }
}
declare class Wallet {
  /** web3 instance */
  private web3;
  /** singleton instance */
  private static instance;
  /** Ethereum provider */
  private provider?;
  /** Wallet connection status */
  private _status;
  /** Currently connected account info */
  private _account;
  /** Set of status change listeners */
  private statusChangeHandlers;
  /** Cache for initialized contract instances */
  private contractInstances;
  /**
   * Constructor
   * @param options Ethereum wallet configuration options
   */
  constructor();
  /**
   * Get singleton instance
   */
  static getInstance(): Wallet;
  private handleAccountsChanged;
  private handleDisconnect;
  private handleChainChanged;
  /**
   * Bind provider events
   */
  private bindProviderEvents;
  /**
   * Unbind provider events
   */
  private unbindProviderEvents;
  /**
   * Initialize wallet connection status
   */
  private initStatus;
  /**
   * Handle provider status change
   * @param accounts List of accounts
   */
  private handleProviderStatusChange;
  /**
   * Update wallet status and notify listeners
   * @param status Wallet status
   * @param account Account information
   */
  private updateStatus;
  /**
   * Notify all status change listeners
   * @param status Wallet status
   * @param account Account information
   */
  private notifyStatusChange;
  /**
   * Get wallet connection status
   * @returns Wallet status
   */
  get status(): EthWalletStatus;
  /**
   * Get currently connected account information
   * @returns Account information
   */
  get account(): EthWalletAccount | null;
  /**
   * Check if wallet is connected
   * @returns Connection status
   */
  get connected(): boolean;
  /**
   * Get MetaMask deep link
   * @returns MetaMask deep link URL
   */
  private getMetaMaskDeepLink;
  /**
   * Add a status change listener
   * @param handler Status change listener
   */
  addStatusChangeListener(handler: (status: EthWalletStatus, account?: EthWalletAccount | null) => void): void;
  /**
   * Remove a status change listener
   * @param handler Status change listener
   */
  removeStatusChangeListener(handler: (status: EthWalletStatus, account?: EthWalletAccount | null) => void): void;
  /**
   * Connect wallet
   * @param deeplinkUrl Optional deeplink URL for mobile wallet, auto-constructed if not provided
   */
  connect(deeplinkUrl?: string): Promise<void>;
  /**
   * Disconnect wallet
   */
  disconnect(): Promise<void>;
  /**
   * Destroy Wallet singleton instance
   */
  static destroy(): void;
  /**
   * Send basic ETH transfer transaction
   * @param to Recipient address
   * @param amount Amount to transfer
   * @param unit Unit (optional, default 'ether', can also be 'wei')
   * @returns Transaction hash
   */
  sendTransaction(to: string, amount: string | number, unit?: 'ether' | 'wei'): Promise<string>;
  /**
   * Initialize smart contract
   * @param contractABI Contract ABI
   * @param contractAddress Contract address
   * @returns Contract instance
   */
  initContract(contractABI: AbiItem[], contractAddress: string): Contract<AbiItem[]>;
  /**
   * Get initialized contract instance
   * @param contractAddress Contract address
   * @returns Contract instance, or undefined if not initialized
   */
  getContract(contractAddress: string): Contract<AbiItem[]> | undefined;
  /**
   * Clear contract instance cache
   * @param contractAddress Optional contract address; clears all cache if not provided
   */
  clearContractCache(contractAddress?: string): void;
  /**
   * Get network name by chainId
   */
  private getChainName;
  /**
   * Format chainId to hex string uniformly
   * @param chainId Chain ID (number or hex string)
   * @returns Hex string formatted chainId
   */
  private formatChainId;
  /**
   * Switch network
   * @param chainId Target network chainId
   * @param networkInfo Network info (only needed if adding network)
   */
  switchNetwork(chainId: string | number, networkInfo?: {
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
  }): Promise<void>;
  /**
   * Get current chain ID
   */
  get currentChainId(): Promise<string>;
  /**
   * Get current network info
   */
  getNetworkInfo(): Promise<{
    chainId: string;
    chainName?: string;
  }>;
  /**
   * Switch to custom network
   * @param chainId Target network chainId
   * @param networkInfo Network information
   */
  switchToCustomNetwork(chainId: string | number, networkInfo: {
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
  }): Promise<void>;
}
//#endregion
export { EthTransactionParams, EthWalletAccount, EthWalletStatus, EthWalletStatusChangeHandler, Wallet };
//# sourceMappingURL=index.d.mts.map