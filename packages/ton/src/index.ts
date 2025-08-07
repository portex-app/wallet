import { TonConnectUI, type TonProofItemReply, type Wallet as TonConnectWallet, type WalletsModalState } from '@tonconnect/ui';
import { toNano, beginCell, Address } from '@ton/core';
import { Buffer } from 'buffer';
import { TonWalletStatus as WalletStatus, type TonWalletAccount as WalletAccountBase } from './types';
window.Buffer = Buffer;

/**
 * Extend WalletAccount with a human-readable address
 */
export interface WalletAccount extends WalletAccountBase {
    /** Human-readable format address */
    addressUserFriendly?: string;
}

// Jetton wallet info type returned by TON API
interface TonApiJettonWalletResponse {
    balance: string;
    wallet_address: {
        address: string;
        is_scam: boolean;
        is_wallet: boolean;
    };
    jetton: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        image: string;
        verification: string;
        score: number;
    };
}

// Jetton wallet info type stored in cache
type JettonWalletCacheItem = TonApiJettonWalletResponse;

// Return type of calculateJettonWalletAddress method
interface JettonWalletInfo {
    address: string;
    decimals: number;
}

/**
 * Convert human-readable amount to the smallest unit
 * @param src Human-readable amount
 * @param decimals Number of decimals
 * @returns Amount in the smallest unit
 */
const convertToSmallestUnit = (src: number | string | bigint, decimals: number = 9): bigint => {
    if (typeof src === 'bigint') {
        return src * 10n ** BigInt(decimals);
    } else {
        if (typeof src === 'number') {
            if (!Number.isFinite(src)) {
                throw Error('Invalid number');
            }
            if (Math.log10(src) <= 6) {
                src = src.toLocaleString('en', { minimumFractionDigits: decimals, useGrouping: false });
            } else if (src - Math.trunc(src) === 0) {
                src = src.toLocaleString('en', { maximumFractionDigits: 0, useGrouping: false });
            } else {
                throw Error('Not enough precision for a number value. Use string value instead');
            }
        }

        // Check sign
        let neg = false;
        while (src.startsWith('-')) {
            neg = !neg;
            src = src.slice(1);
        }

        // Split string
        if (src === '.') {
            throw Error('Invalid number');
        }
        const parts = src.split('.');
        if (parts.length > 2) {
            throw Error('Invalid number');
        }

        // Prepare parts
        let whole = parts[0];
        let frac = parts[1];
        if (!whole) {
            whole = '0';
        }
        if (!frac) {
            frac = '0';
        }
        if (frac.length > decimals) {
            throw Error('Invalid number');
        }
        while (frac.length < decimals) {
            frac += '0';
        }

        // Convert
        let r = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(frac);
        if (neg) {
            r = -r;
        }
        return r;
    }
};

export class Wallet {
    /** TonConnect UI instance */
    private tonConnectUI!: TonConnectUI;

    /** Singleton instance */
    private static instance: Wallet | null = null;

    /** Wallet connection status */
    private _status: WalletStatus = WalletStatus.DISCONNECTED;

    /** Current connected account info */
    private _account: WalletAccount | null = null;

    /** Set of status change listeners */
    private statusChangeHandlers: Set<(status: WalletStatus, account?: WalletAccount | null) => void> = new Set();

    /** Cache for Jetton wallet addresses */
    private jettonWalletCache: Map<string, JettonWalletCacheItem> = new Map();

    /** Unsubscribe function for TonConnect status changes */
    private _tonConnectStatusUnsubscribe?: () => void;

    /**
     * Constructor
     * @param options TON wallet configuration options
     */
    private constructor(options: { manifestUrl: string }) {
        this.tonConnectUI = new TonConnectUI({
            manifestUrl: options.manifestUrl
        });

        // Configure iOS Universal Links workaround
        // Only applied on iOS devices, as recommended by TonConnect
        // Prevents wallets from not opening correctly with async operations
        // Reference: https://github.com/ton-connect/sdk/tree/main/packages/ui#universal-links-redirecting-issues-ios
        if (this.isIOSDevice()) {
            this.tonConnectUI.uiOptions = {
                actionsConfiguration: {
                    skipRedirectToWallet: 'ios'
                }
            };
        }

        // Listen for wallet status changes
        this._tonConnectStatusUnsubscribe = this.tonConnectUI.onStatusChange(wallet => {
            this.handleTonConnectStatusChange(wallet);
        });
    }

    /**
     * Get the singleton Wallet instance
     * @param manifestUrl TON Connect manifest URL
     * @returns Wallet instance
     */
    public static getInstance(manifestUrl: string): Wallet {
        if (!Wallet.instance) {
            Wallet.instance = new Wallet({ manifestUrl });
        }
        return Wallet.instance;
    }

    /**
     * Detect if the device is iOS
     * @returns true if iOS device
     */
    private isIOSDevice(): boolean {
        if (typeof window === 'undefined' || !window.navigator) {
            return false;
        }

        const userAgent = window.navigator.userAgent;
        const platform = (window.navigator as Navigator & { platform?: string }).platform || '';

        // Multiple ways to detect iOS devices
        return (
            /iPad|iPhone|iPod/.test(userAgent) ||
            (platform === 'MacIntel' && window.navigator.maxTouchPoints > 1) || // iPad Pro
            /iOS/.test(userAgent)
        );
    }

    /**
     * Handle TonConnect status change event
     * @param wallet Wallet status info
     */
    private handleTonConnectStatusChange(wallet: TonConnectWallet | null) {
        if (wallet?.account) {
            const account: WalletAccount = {
                address: wallet.account.address,
                publicKey: wallet.account.publicKey || undefined,
                chainId: wallet.account.chain,
                addressUserFriendly: (() => {
                    try {
                        // Using this.addressUserFriendly may be outdated,
                        // get fresh human-readable address from event
                        return Address.parse(wallet.account.address).toString({ testOnly: this.getNetwork() === 'testnet' });
                    } catch {
                        return undefined;
                    }
                })()
            };
            this.updateStatus(WalletStatus.CONNECTED, account);
        } else {
            this.updateStatus(WalletStatus.DISCONNECTED, null);
        }
    }

    /**
     * Destroy the current instance (legacy API)
     * @deprecated Please call the instance's destroy() method directly
     */
    public static destroy() {
        if (Wallet.instance) {
            Wallet.instance.destroy();
            Wallet.instance = null;
        }
    }

    /** Get wallet connection status */
    get status(): WalletStatus {
        return this._status;
    }

    /** Get current connected account info */
    get account(): WalletAccount | null {
        return this._account;
    }

    /** Check if wallet is connected */
    get connected(): boolean {
        return this._status === WalletStatus.CONNECTED && this._account !== null;
    }

    /**
     * Get raw TonConnect wallet instance
     * @returns Current connected wallet instance or undefined if disconnected
     */
    get wallet() {
        return this.tonConnectUI.wallet;
    }

    /**
     * Get current connected TonConnect account info
     * @returns Current connected account info or undefined if disconnected
     */
    get tonAccount() {
        return this.tonConnectUI.account;
    }

    /**
     * Get current connected wallet address
     * @returns Wallet address or undefined if disconnected
     */
    get address() {
        return this.tonConnectUI.account?.address;
    }

    /**
     * Get current wallet address in human-readable format (non-bounceable, consistent with wallet UI)
     * @returns Human-readable address (e.g. UQ... / KQ...)
     */
    get addressUserFriendly(): string | undefined {
        if (!this.tonConnectUI.account?.address) return undefined;
        try {
            return Address.parse(this.tonConnectUI.account.address).toString({
                testOnly: this.getNetwork() === 'testnet',
                bounceable: false
            });
        } catch {
            return undefined;
        }
    }

    /**
     * Update wallet status
     * @param status New status
     * @param account Account info
     */
    private updateStatus(status: WalletStatus, account?: WalletAccount | null) {
        this._status = status;
        if (account !== undefined) {
            this._account = account;
        }
        this.notifyStatusChange(status, this._account);
    }

    /**
     * Notify all listeners of status change
     * @param status New status
     * @param account Account info
     */
    private notifyStatusChange(status: WalletStatus, account?: WalletAccount | null) {
        this.statusChangeHandlers.forEach(handler => {
            try {
                handler(status, account);
            } catch (error) {
                console.warn('Wallet status change listener threw an error:', error);
            }
        });
    }

    /**
     * Get TON Proof
     * @returns TON Proof data or null if not available
     */
    getTonProof(): TonProofItemReply | null {
        const wallet = this.tonConnectUI.wallet;
        if (!wallet) return null;

        const tonProof = wallet.connectItems?.tonProof;
        if (tonProof && 'proof' in tonProof) {
            return tonProof as TonProofItemReply;
        }
        return null;
    }

    /**
     * Listen for TonConnect wallet connection status changes
     * @param handler Listener function with WalletStatus and WalletAccount parameters
     * @returns Unsubscribe function
     */
    onStatusChange(handler: (status: WalletStatus, account?: WalletAccount | null) => void): () => void {
        // Directly listen to TonConnectUI status changes, convert to WalletStatus and WalletAccount
        return this.tonConnectUI.onStatusChange(wallet => {
            if (wallet?.account) {
                const account: WalletAccount = {
                    address: wallet.account.address,
                    publicKey: wallet.account.publicKey || undefined,
                    chainId: wallet.account.chain,
                    addressUserFriendly: this.addressUserFriendly,
                };
                handler(WalletStatus.CONNECTED, account);
            } else {
                handler(WalletStatus.DISCONNECTED, null);
            }
        });
    }

    /**
     * Destroy wallet instance
     */
    destroy(): void {
        if (this.tonConnectUI.connected) {
            this.tonConnectUI.disconnect();
        }
        this.tonConnectUI.closeModal();

        // Unsubscribe onStatusChange
        if (this._tonConnectStatusUnsubscribe) {
            this._tonConnectStatusUnsubscribe();
            this._tonConnectStatusUnsubscribe = undefined;
        }

        // Clear singleton instance
        if (Wallet.instance === this) {
            Wallet.instance = null;
        }

        this.statusChangeHandlers.clear();
        this.jettonWalletCache.clear(); // Clear cache
        this._status = WalletStatus.DISCONNECTED;
        this._account = null;
    }

    /**
     * Connect to wallet
     * @returns Whether the connection was successful
     */
    async connect(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let resolved = false;
            // Listen for modal close, onModalStateChange returns unsubscribe function
            const unsubscribe = this.tonConnectUI.onModalStateChange((state: WalletsModalState) => {
                if (state.status === 'closed') {
                    if (!resolved) {
                        resolved = true;
                        unsubscribe(); // Unsubscribe listener
                        resolve(this.connected);
                    }
                }
            });
            // Open modal
            try {
                this.tonConnectUI.openModal().catch((err) => {
                    if (!resolved) {
                        resolved = true;
                        unsubscribe();
                        reject(err);
                    }
                });
            } catch (err) {
                if (!resolved) {
                    resolved = true;
                    unsubscribe();
                    reject(err);
                }
            }
        });
    }

    /**
     * Disconnect wallet
     */
    async disconnect(): Promise<void> {
        await this.tonConnectUI.disconnect();
    }

    /**
     * Send TON transaction
     * @param to Recipient address
     * @param amount Amount to send (TON)
     * @param message Optional message content
     * @returns Transaction hash
     */
    async sendTransaction(to: string, amount: number, message?: string): Promise<string> {
        if (!this.connected) {
            throw new Error('Wallet is not connected');
        }
        if (!to || typeof to !== 'string' || to.trim() === '') {
            throw new Error('Recipient address cannot be empty');
        }
        if (amount === undefined || amount === null || isNaN(amount) || Number(amount) <= 0) {
            throw new Error('Amount must be a number greater than 0');
        }

        try {
            const nanoAmount = toNano(amount.toString());

            let cellPayload: string | undefined;
            if (message) {
                // Create a cell containing the text message
                const cell = beginCell()
                    .storeUint(0, 32) // Store 32 zero bits indicating text comment follows
                    .storeStringTail(message) // Store the text comment
                    .endCell();

                // Convert cell to base64 encoded BOC
                cellPayload = cell.toBoc().toString('base64');
            } else {
                cellPayload = undefined;
            }

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes timeout
                messages: [
                    {
                        address: to,
                        amount: nanoAmount.toString(),
                        payload: cellPayload
                    }
                ]
            };
            console.log('Transaction info', transaction);
            const result = await this.tonConnectUI.sendTransaction(transaction);
            console.log('[DEBUG] sendTransaction returned:', result);
            return result.boc;
        } catch (error) {
            console.error('Failed to send transaction:', error);
            throw error;
        }
    }

    /**
     * Send JETTON token transaction
     * @param jettonMasterAddress JETTON master contract address
     * @param to Recipient address
     * @param amount Amount to send (human-readable, auto converted to smallest unit)
     * @param message Optional message content
     * @param gasAmount Optional gas fee (TON), default 0.1
     * @returns Transaction hash
     */
    async sendJettonTransaction(jettonMasterAddress: string, to: string, amount: number, message?: string): Promise<string> {
        if (!this.connected) throw new Error('Wallet is not connected');
        if (!jettonMasterAddress) throw new Error('JETTON master contract address cannot be empty');
        if (!to) throw new Error('Recipient address cannot be empty');
        if (!amount || isNaN(amount) || Number(amount) <= 0) throw new Error('Amount must be a number greater than 0');
        if (!this.address) throw new Error('Cannot get current wallet address');

        try {

            const { address: jettonWalletAddress, decimals } = await this.calculateJettonWalletAddress(jettonMasterAddress, this.address);

            let forwardPayloadCell;
            if (message) {
                forwardPayloadCell = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
            } else {
                forwardPayloadCell = beginCell().endCell();
            }
            console.log('decimals1', decimals);
            const sendJettonTransactionAmount = convertToSmallestUnit(amount, decimals);
            console.log('sendJettonTransactionAmount', sendJettonTransactionAmount);
            const jettonTransferBody = beginCell()
                .storeUint(0xf8a7ea5, 32) // Jetton transfer op code
                .storeUint(0, 64) // query_id
                .storeCoins(sendJettonTransactionAmount) // Amount of Jettons to transfer
                .storeAddress(Address.parse(to)) // Recipient address
                .storeAddress(Address.parse(to)) // Response address (usually same as sender)
                .storeBit(0) // No custom payload
                .storeCoins(0) // TON amount forwarded with transfer
                .storeBit(forwardPayloadCell ? 1 : 0) // Whether there is a comment
                .storeRef(forwardPayloadCell)
                .endCell();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes validity
                messages: [
                    {
                        address: jettonWalletAddress, // Use sender's Jetton wallet address
                        amount: toNano('0.1').toString(), // Enough TON for gas
                        payload: jettonTransferBody.toBoc().toString('base64') // Message body
                    }
                ]
            };
            console.log('transaction', transaction);
            const result = await this.tonConnectUI.sendTransaction(transaction);
            console.log('Transaction sent:', result);
            return result.boc;
        } catch (error) {
            console.error('[JETTON][ERROR] Failed to send JETTON transaction:', error);
            throw error;
        }
    }

    /**
     * Get current network type
     * @returns 'mainnet' | 'testnet'
     */
    getNetwork(): 'mainnet' | 'testnet' {
        const chain = this.tonConnectUI.account?.chain;
        return chain === '-3' ? 'testnet' : 'mainnet';
    }

    /**
     * Get the Jetton wallet address
     * @param jettonMasterAddress Jetton master contract address
     * @param ownerAddress User wallet address
     * @returns Jetton wallet address info
     */
    async calculateJettonWalletAddress(jettonMasterAddress: string, ownerAddress: string): Promise<JettonWalletInfo> {
        // Generate cache key
        const cacheKey = `${jettonMasterAddress}_${ownerAddress}`;

        // Check if cache exists
        const cached = this.jettonWalletCache.get(cacheKey);
        if (cached) {
            console.log('[CACHE] Using cached Jetton wallet address:', cacheKey);
            return {
                address: cached.wallet_address.address,
                decimals: cached.jetton.decimals
            };
        }

        try {
            const network = this.getNetwork();
            const apiUrl =
                network === 'testnet'
                    ? `https://testnet.tonapi.io/v2/accounts/${encodeURIComponent(ownerAddress)}/jettons/${encodeURIComponent(jettonMasterAddress)}`
                    : `https://tonapi.io/v2/accounts/${encodeURIComponent(ownerAddress)}/jettons/${encodeURIComponent(jettonMasterAddress)}`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!data || !data.wallet_address) {
                throw new Error('Transaction failed to send: Insufficient balance!');
            }

            const result = {
                address: data.wallet_address.address,
                decimals: data.jetton.decimals
            };

            // Cache the query result in memory
            this.jettonWalletCache.set(cacheKey, {
                ...data
            });

            console.log('[CACHE] Cached Jetton wallet address:', cacheKey, result);

            return result;
        } catch (error) {
            console.error('Failed to get Jetton wallet address:', error);
            throw error;
        }
    }

    /**
     * @deprecated Please use onStatusChange(handler) instead. This method will be removed in future versions.
     * Add a custom status change listener (not recommended for new projects)
     */
    addStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void): void {
        console.warn('[DEPRECATED] addStatusChangeListener is deprecated, please use onStatusChange(handler) instead.');
        this.statusChangeHandlers.add(handler);
    }

    /**
     * @deprecated Please use the unsubscribe function returned by onStatusChange(handler) instead. This method will be removed in future versions.
     * Remove a custom status change listener (not recommended for new projects)
     */
    removeStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void): void {
        console.warn('[DEPRECATED] removeStatusChangeListener is deprecated, please use the unsubscribe function returned by onStatusChange(handler).');
        this.statusChangeHandlers.delete(handler);
    }

}

// Export type definitions
export * from './types';
