/**
 * TON Wallet connection status
 */
export enum TonWalletStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
}

/**
 * TON Wallet account information
 */
export interface TonWalletAccount {
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
export interface TonTransactionParams {
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
export interface TonJettonTransactionParams extends TonTransactionParams {
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
export type TonWalletStatusChangeHandler = (status: TonWalletStatus, account?: TonWalletAccount | null) => void;
