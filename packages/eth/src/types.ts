/**
 * Ethereum wallet connection status
 */
export enum EthWalletStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
}

/**
 * Ethereum wallet account information
 */
export interface EthWalletAccount {
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
export interface EthTransactionParams {
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
export type EthWalletStatusChangeHandler = (status: EthWalletStatus, account?: EthWalletAccount | null) => void;
