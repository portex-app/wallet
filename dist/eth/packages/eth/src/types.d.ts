/**
 * 以太坊钱包连接状态
 */
export declare enum EthWalletStatus {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    ERROR = "error"
}
/**
 * 以太坊钱包账户信息
 */
export interface EthWalletAccount {
    /** 钱包地址 */
    address: string;
    /** 钱包公钥（以太坊中较少使用） */
    publicKey?: string;
    /** 以太坊链ID */
    chainId?: string | number;
}
/**
 * 以太坊交易参数接口
 */
export interface EthTransactionParams {
    /** 接收地址 */
    to: string;
    /** 发送金额 */
    amount: string;
    /** 交易数据 */
    data?: string;
    /** Gas 限制 */
    gasLimit?: string;
    /** Gas 价格 */
    gasPrice?: string;
    /** EIP-1559 最大费用 */
    maxFeePerGas?: string;
    /** EIP-1559 最大优先费用 */
    maxPriorityFeePerGas?: string;
    /** Nonce */
    nonce?: number;
    /** 自定义参数 */
    [key: string]: unknown;
}
/**
 * 以太坊钱包状态变化监听器
 */
export type EthWalletStatusChangeHandler = (status: EthWalletStatus, account?: EthWalletAccount | null) => void;
