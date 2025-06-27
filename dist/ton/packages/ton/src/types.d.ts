/**
 * TON 钱包连接状态
 */
export declare enum TonWalletStatus {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    ERROR = "error"
}
/**
 * TON 钱包账户信息
 */
export interface TonWalletAccount {
    /** 钱包地址 */
    address: string;
    /** 钱包公钥 */
    publicKey?: string;
    /** TON 链ID (-239 主网, -3 测试网) */
    chainId?: string | number;
}
/**
 * TON 交易参数接口
 */
export interface TonTransactionParams {
    /** 接收地址 */
    to: string;
    /** 发送金额 (nanoTON) */
    amount: string;
    /** 消息负载 */
    payload?: string;
    /** 有效期（Unix 时间戳） */
    validUntil?: number;
    /** 是否将消息体作为 Cell */
    stateInit?: string;
    /** 自定义参数 */
    [key: string]: unknown;
}
/**
 * TON Jetton 代币交易参数
 */
export interface TonJettonTransactionParams extends TonTransactionParams {
    /** Jetton 主合约地址 */
    jettonMasterAddress: string;
    /** Jetton 小数位数 */
    decimals?: number;
    /** 转发 TON 金额 */
    forwardAmount?: string;
}
/**
 * TON 钱包状态变化监听器
 */
export type TonWalletStatusChangeHandler = (status: TonWalletStatus, account?: TonWalletAccount | null) => void;
