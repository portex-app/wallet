import { type TonProofItemReply, type Wallet as TonConnectWallet } from '@tonconnect/ui';
import { TonWalletStatus as WalletStatus, type TonWalletAccount as WalletAccount } from './types';
interface JettonWalletInfo {
    address: string;
    decimals: number;
}
export declare class Wallet {
    /** TonConnect UI 实例 */
    private tonConnectUI;
    /** 单例实例 */
    private static instance;
    /** 钱包连接状态 */
    private _status;
    /** 当前连接的账户信息 */
    private _account;
    /** 状态变化监听器集合 */
    private statusChangeHandlers;
    /** Jetton钱包地址缓存 */
    private jettonWalletCache;
    /**
     * 构造函数
     * @param options TON 钱包配置选项
     */
    private constructor();
    /**
     * 获取 Wallet 单例实例
     * @param manifestUrl TON Connect manifest URL
     * @returns Wallet 实例
     */
    static getInstance(manifestUrl: string): Wallet;
    /**
     * 处理 TonConnect 状态变化
     * @param wallet 钱包状态
     */
    private handleTonConnectStatusChange;
    /**
     * 销毁当前实例（兼容旧API）
     * @deprecated 请直接调用实例的 destroy() 方法
     */
    static destroy(): void;
    /** 获取钱包连接状态 */
    get status(): WalletStatus;
    /** 获取当前连接的账户信息 */
    get account(): WalletAccount | null;
    /** 获取是否已连接 */
    get connected(): boolean;
    /**
     * 获取原始 TonConnect 钱包实例
     * @returns 当前连接的钱包实例，如果未连接则返回 undefined
     */
    get wallet(): TonConnectWallet | (TonConnectWallet & import("@tonconnect/ui").WalletInfoWithOpenMethod) | null;
    /**
     * 获取当前连接的 TonConnect 账户信息
     * @returns 当前连接的账户信息，如果未连接则返回 undefined
     */
    get tonAccount(): import("@tonconnect/ui").Account | null;
    /**
     * 获取当前连接的钱包地址
     * @returns 当前连接的钱包地址，如果未连接则返回 undefined
     */
    get address(): string | undefined;
    /**
     * 更新钱包状态
     * @param status 新状态
     * @param account 账户信息
     */
    private updateStatus;
    /**
     * 通知所有监听器状态变化
     * @param status 新状态
     * @param account 账户信息
     */
    private notifyStatusChange;
    /**
     * 获取 TON Proof
     * @returns TON Proof 数据，如果未获取到则返回 null
     */
    getTonProof(): TonProofItemReply | null;
    /**
     * 添加状态变化监听器
     * @param handler 监听器函数
     */
    addStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void): void;
    /**
     * 移除状态变化监听器
     * @param handler 监听器函数
     */
    removeStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void): void;
    /**
     * 销毁钱包实例
     */
    destroy(): void;
    /**
     * 连接钱包
     */
    connect(): Promise<void>;
    /**
     * 断开钱包连接
     */
    disconnect(): Promise<void>;
    /**
     * 发送 TON 交易
     * @param to 接收地址
     * @param amount 发送金额（TON）
     * @param message 可选的消息内容
     * @returns 交易哈希
     */
    sendTransaction(to: string, amount: number, message?: string): Promise<string>;
    /**
     * 发送 JETTON 代币交易
     * @param jettonMasterAddress JETTON主合约地址
     * @param to 接收地址
     * @param amount 发送金额（人类可读数量，自动转最小单位）
     * @param message 可选的消息内容
     * @param gasAmount 可选的gas费（TON），默认0.1
     * @returns 交易哈希
     */
    sendJettonTransaction(jettonMasterAddress: string, to: string, amount: number, message?: string): Promise<string>;
    /**
     * 获取当前网络类型
     * @returns 'mainnet' | 'testnet'
     */
    getNetwork(): 'mainnet' | 'testnet';
    /**
     * 获取Jetton钱包地址
     * @param jettonMasterAddress Jetton主合约地址
     * @param ownerAddress 用户钱包地址
     * @returns Jetton钱包地址
     */
    calculateJettonWalletAddress(jettonMasterAddress: string, ownerAddress: string): Promise<JettonWalletInfo>;
}
export * from './types';
