import Web3, { type Contract, type AbiItem, type EIP1193Provider } from 'web3';
import { EthWalletStatus as WalletStatus, type EthWalletAccount as WalletAccount } from './types';

declare global {
    interface Window {
        ethereum?: EIP1193Provider<unknown>;
    }
}

export class Wallet {
    /** web3 instance */
    private web3: Web3 | null = null;
    /** singleton instance */
    private static instance: Wallet | null = null;
    /** Ethereum provider */
    private provider?: EIP1193Provider<unknown>;
    /** Wallet connection status */
    private _status: WalletStatus = WalletStatus.DISCONNECTED;

    /** Currently connected account info */
    private _account: WalletAccount | null = null;

    /** Set of status change listeners */
    private statusChangeHandlers: Set<(status: WalletStatus, account?: WalletAccount | null) => void> = new Set();

    /** Cache for initialized contract instances */
    private contractInstances: Map<string, Contract<AbiItem[]>> = new Map();

    /**
     * Constructor
     * @param options Ethereum wallet configuration options
     */
    constructor() {
        if (typeof window !== 'undefined' && window.ethereum) {
            this.provider = window.ethereum;
            this.web3 = new Web3(this.provider);

            this.initStatus();
            this.bindProviderEvents();
        }
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): Wallet {
        if (!Wallet.instance) {
            Wallet.instance = new Wallet();
        }
        return Wallet.instance;
    }

    private handleAccountsChanged = (accounts: string[]) => {
        this.handleProviderStatusChange(accounts);
    };

    private handleDisconnect = () => {
        this.handleProviderStatusChange([]);
    };

    private handleChainChanged = () => {
        // Re-initialize status when network changes
        this.initStatus();
    };

    /**
     * Bind provider events
     */
    private bindProviderEvents() {
        this.provider?.on?.('accountsChanged', this.handleAccountsChanged);
        this.provider?.on?.('disconnect', this.handleDisconnect);
        this.provider?.on?.('chainChanged', this.handleChainChanged);
    }

    /**
     * Unbind provider events
     */
    private unbindProviderEvents() {
        this.provider?.removeListener?.('accountsChanged', this.handleAccountsChanged);
        this.provider?.removeListener?.('disconnect', this.handleDisconnect);
        this.provider?.removeListener?.('chainChanged', this.handleChainChanged);
    }

    /**
     * Initialize wallet connection status
     */
    private async initStatus() {
        try {
            const explicitlyConnected = localStorage.getItem('ethWalletExplicitlyConnected') === 'true';
            const accounts = (await this.provider?.request({ method: 'eth_accounts' })) as string[] | undefined;

            if (explicitlyConnected && accounts && accounts.length > 0) {
                this.handleProviderStatusChange(accounts);
            } else {
                this.updateStatus(WalletStatus.DISCONNECTED, null);
            }
        } catch {
            this.updateStatus(WalletStatus.DISCONNECTED, null);
        }
    }

    /**
     * Handle provider status change
     * @param accounts List of accounts
     */
    private handleProviderStatusChange(accounts?: string[]) {
        if (accounts && accounts.length > 0) {
            const account: WalletAccount = {
                address: accounts[0] as string
            };
            this.updateStatus(WalletStatus.CONNECTED, account);
        } else {
            this.updateStatus(WalletStatus.DISCONNECTED, null);
        }
    }

    /**
     * Update wallet status and notify listeners
     * @param status Wallet status
     * @param account Account information
     */
    private updateStatus(status: WalletStatus, account: WalletAccount | null) {
        this._status = status;
        this._account = account;

        // Cache current status and account address locally
        if (status === WalletStatus.CONNECTED && this._account) {
            localStorage.setItem('ethWalletStatus', 'connected');
            localStorage.setItem('ethWalletAccount', this._account.address);
        } else {
            localStorage.removeItem('ethWalletStatus');
            localStorage.removeItem('ethWalletAccount');
        }

        this.notifyStatusChange(status, account);
    }

    /**
     * Notify all status change listeners
     * @param status Wallet status
     * @param account Account information
     */
    private notifyStatusChange(status: WalletStatus, account: WalletAccount | null) {
        this.statusChangeHandlers.forEach(handler => {
            try {
                handler(status, account);
            } catch (error) {
                console.warn('Wallet status change listener threw an error:', error);
            }
        });
    }

    /**
     * Get wallet connection status
     * @returns Wallet status
     */
    get status(): WalletStatus {
        return this._status;
    }

    /**
     * Get currently connected account information
     * @returns Account information
     */
    get account(): WalletAccount | null {
        return this._account;
    }

    /**
     * Check if wallet is connected
     * @returns Connection status
     */
    get connected(): boolean {
        return this._status === WalletStatus.CONNECTED && this._account !== null;
    }

    /**
     * Get MetaMask deep link
     * @returns MetaMask deep link URL
     */
    private getMetaMaskDeepLink(): string {
        if (typeof window === 'undefined') {
            throw new Error('Not running in a browser environment');
        }
        const host = window.location.host;
        // Use only host to avoid path issues
        return `https://metamask.app.link/dapp/${host}`;
    }

    /**
     * Add a status change listener
     * @param handler Status change listener
     */
    public addStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void) {
        this.statusChangeHandlers.add(handler);
    }

    /**
     * Remove a status change listener
     * @param handler Status change listener
     */
    public removeStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void) {
        this.statusChangeHandlers.delete(handler);
    }

    /**
     * Connect wallet
     * @param deeplinkUrl Optional deeplink URL for mobile wallet, auto-constructed if not provided
     */
    public async connect(deeplinkUrl?: string): Promise<void> {
        if (typeof window === 'undefined') {
            throw new Error('Not running in a browser environment');
        }
        if (window.ethereum) {
            try {
                // Request permissions first, which will force MetaMask popup
                await window.ethereum.request({
                    method: 'wallet_requestPermissions',
                    params: [{ eth_accounts: {} }]
                });
                const response = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const accounts = response as unknown as string[];
                localStorage.setItem('ethWalletExplicitlyConnected', 'true');
                this.handleProviderStatusChange(accounts);
            } catch (error) {
                console.error('Failed to connect wallet or user denied:', error);
                throw error;
            }
        } else {
            const url = deeplinkUrl ?? this.getMetaMaskDeepLink();
            window.location.href = url;
            // User will be redirected to wallet app's built-in browser to open dapp, subsequent user actions follow
        }
    }

    /**
     * Disconnect wallet
     */
    public async disconnect(): Promise<void> {
        try {
            // Clear local state
            this._account = null;
            this.updateStatus(WalletStatus.DISCONNECTED, null);

            // Remove event listeners
            this.unbindProviderEvents();

            // Clear local storage
            localStorage.removeItem('ethWalletStatus');
            localStorage.removeItem('ethWalletAccount');
        } catch (error) {
            console.warn('Error occurred while disconnecting wallet:', error);
        }
    }

    /**
     * Destroy Wallet singleton instance
     */
    public static destroy(): void {
        if (Wallet.instance) {
            const instance = Wallet.instance;
            instance.disconnect();
            instance.statusChangeHandlers.clear();
            instance.provider = undefined;
            instance.web3 = null;
            Wallet.instance = null;
        }
    }

    /**
     * Send basic ETH transfer transaction
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param unit Unit (optional, default 'ether', can also be 'wei')
     * @returns Transaction hash
     */
    public async sendTransaction(to: string, amount: string | number, unit: 'ether' | 'wei' = 'ether'): Promise<string> {
        if (!this.connected || !this._account) {
            throw new Error('Wallet is not connected');
        }
        if (!this.web3) {
            throw new Error('web3 instance does not exist');
        }
        if (!this.provider) {
            throw new Error('provider does not exist');
        }

        const from = this._account.address;
        const valueInWei = this.web3.utils.toWei(amount.toString(), unit);

        try {
            const txParams = {
                from,
                to,
                value: valueInWei
            };

            const response = (await this.provider.request({
                method: 'eth_sendTransaction',
                params: [txParams]
            })) as { result: string };

            if (!response.result || typeof response.result !== 'string') {
                throw new Error('Invalid transaction hash format');
            }

            return response.result;
        } catch (error) {
            console.error('Failed to send ETH transaction:', error);
            throw error;
        }
    }

    /**
     * Initialize smart contract
     * @param contractABI Contract ABI
     * @param contractAddress Contract address
     * @returns Contract instance
     */
    public initContract(contractABI: AbiItem[], contractAddress: string): Contract<AbiItem[]> {
        if (!this.web3) {
            throw new Error('web3 instance does not exist');
        }

        // Check if the contract is already initialized
        const cacheKey = `${contractAddress.toLowerCase()}`;
        const cachedContract = this.contractInstances.get(cacheKey);
        if (cachedContract) {
            return cachedContract;
        }

        try {
            // Create new contract instance
            const contract = new this.web3.eth.Contract(contractABI, contractAddress);

            // Cache contract instance
            this.contractInstances.set(cacheKey, contract);

            return contract;
        } catch (error) {
            console.error('Failed to initialize smart contract:', error);
            throw error;
        }
    }

    /**
     * Get initialized contract instance
     * @param contractAddress Contract address
     * @returns Contract instance, or undefined if not initialized
     */
    public getContract(contractAddress: string): Contract<AbiItem[]> | undefined {
        const cacheKey = `${contractAddress.toLowerCase()}`;
        return this.contractInstances.get(cacheKey);
    }

    /**
     * Clear contract instance cache
     * @param contractAddress Optional contract address; clears all cache if not provided
     */
    public clearContractCache(contractAddress?: string): void {
        if (contractAddress) {
            const cacheKey = `${contractAddress.toLowerCase()}`;
            this.contractInstances.delete(cacheKey);
        } else {
            this.contractInstances.clear();
        }
    }

    /**
     * Get network name by chainId
     */
    private getChainName(chainId: string): string | undefined {
        const chainIdMap: Record<string, string> = {
            '0x1': 'Ethereum Mainnet',
            '0x5': 'Goerli Testnet',
            '0xaa36a7': 'Sepolia Testnet',
            '0x89': 'Polygon Mainnet',
            '0x13881': 'Mumbai Testnet',
            '0xa': 'Optimism',
            '0x420': 'Optimism Goerli',
            '0xa4b1': 'Arbitrum One',
            '0x66eed': 'Arbitrum Goerli'
        };
        return chainIdMap[chainId.toLowerCase()];
    }

    /**
     * Format chainId to hex string uniformly
     * @param chainId Chain ID (number or hex string)
     * @returns Hex string formatted chainId
     */
    private formatChainId(chainId: string | number): string {
        // Check for null or undefined
        if (chainId == null) {
            throw new Error('chainId cannot be null or undefined');
        }

        // If object, try to extract chainId property
        if (typeof chainId === 'object') {
            if ('chainId' in chainId) {
                chainId = (chainId as Record<string, unknown>).chainId as string | number;
            } else {
                throw new Error('Invalid chainId format');
            }
        }

        // Handle number type
        if (typeof chainId === 'number') {
            return `0x${chainId.toString(16)}`;
        }

        // Handle string type
        if (typeof chainId === 'string') {
            // If already hex string, ensure 0x prefix
            if (chainId.startsWith('0x')) {
                return chainId.toLowerCase();
            }
            // If decimal string, convert to hex
            const num = parseInt(chainId);
            if (isNaN(num)) {
                throw new Error('Invalid chainId format');
            }
            return `0x${num.toString(16)}`;
        }

        throw new Error('Invalid chainId format');
    }

    /**
     * Switch network
     * @param chainId Target network chainId
     * @param networkInfo Network info (only needed if adding network)
     */
    public async switchNetwork(
        chainId: string | number,
        networkInfo?: {
            chainName: string;
            nativeCurrency: {
                name: string;
                symbol: string;
                decimals: number;
            };
            rpcUrls: string[];
            blockExplorerUrls?: string[];
        }
    ): Promise<void> {
        if (!this.provider) {
            throw new Error('provider does not exist');
        }

        const formattedChainId = this.formatChainId(chainId);

        try {
            // Try switching network
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: formattedChainId }]
            });
        } catch (error: unknown) {
            // If error code is 4902, network is not added
            if ((error as { code?: number }).code === 4902 && networkInfo) {
                try {
                    // Try adding network
                    await this.provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: formattedChainId,
                                chainName: networkInfo.chainName,
                                nativeCurrency: networkInfo.nativeCurrency,
                                rpcUrls: networkInfo.rpcUrls,
                                blockExplorerUrls: networkInfo.blockExplorerUrls
                            }
                        ]
                    });
                } catch (addError) {
                    console.error('Failed to add network:', addError);
                    throw new Error('Failed to add network, please add it manually');
                }
            } else {
                console.error('Failed to switch network:', error);
                throw new Error('Failed to switch network');
            }
        }
    }

    /**
     * Get current chain ID
     */
    get currentChainId(): Promise<string> {
        if (!this.provider) {
            throw new Error('provider does not exist');
        }
        return this.provider.request({ method: 'eth_chainId' }).then((response: unknown) => response as string);
    }

    /**
     * Get current network info
     */
    public async getNetworkInfo(): Promise<{
        chainId: string;
        chainName?: string;
    }> {
        if (!this.provider) {
            throw new Error('provider does not exist');
        }

        try {
            const chainId = await this.currentChainId;
            return {
                chainId,
                chainName: this.getChainName(chainId)
            };
        } catch (error) {
            console.error('Failed to get network info:', error);
            throw new Error('Failed to get network info');
        }
    }

    /**
     * Switch to custom network
     * @param chainId Target network chainId
     * @param networkInfo Network information
     */
    public async switchToCustomNetwork(
        chainId: string | number,
        networkInfo: {
            chainName: string;
            nativeCurrency: {
                name: string;
                symbol: string;
                decimals: number;
            };
            rpcUrls: string[];
            blockExplorerUrls?: string[];
        }
    ): Promise<void> {
        if (!this.provider) {
            throw new Error('provider does not exist');
        }

        const formattedChainId = this.formatChainId(chainId);

        try {
            // Try switching network
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: formattedChainId }]
            });
        } catch (error: unknown) {
            // If error code is 4902, network is not added
            if ((error as { code?: number }).code === 4902) {
                try {
                    // Try adding network
                    await this.provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: formattedChainId,
                                chainName: networkInfo.chainName,
                                nativeCurrency: networkInfo.nativeCurrency,
                                rpcUrls: networkInfo.rpcUrls,
                                blockExplorerUrls: networkInfo.blockExplorerUrls
                            }
                        ]
                    });
                } catch (addError) {
                    console.error('Failed to add network:', addError);
                    throw new Error('Failed to add network, please add it manually');
                }
            } else {
                console.error('Failed to switch network:', error);
                throw new Error('Failed to switch network');
            }
        }
    }
}

// Export type definitions
export * from './types';
