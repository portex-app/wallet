import { AbiItem, Contract, EIP1193Provider } from "web3";

//#region src/types.d.ts
/**
 * 以太坊钱包连接状态
 */
declare enum EthWalletStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}
/**
 * 以太坊钱包账户信息
 */
interface EthWalletAccount {
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
interface EthTransactionParams {
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
  /** web3 实例 */
  private web3;
  /** 单例实例 */
  private static instance;
  /** 以太坊 provider */
  private provider?;
  /** 钱包连接状态 */
  private _status;
  /** 当前连接的账户信息 */
  private _account;
  /** 状态变化监听器集合 */
  private statusChangeHandlers;
  /** 已初始化的合约实例缓存 */
  private contractInstances;
  /**
   * 构造函数
   * @param options 以太坊钱包配置选项
   */
  constructor();
  /**
   * 获取单例实例
   */
  static getInstance(): Wallet;
  private handleAccountsChanged;
  private handleDisconnect;
  private handleChainChanged;
  /**
   * 绑定 provider 的事件
   */
  private bindProviderEvents;
  /**
   * 移除 provider 的事件
   */
  private unbindProviderEvents;
  /**
   * 初始化钱包连接状态
   */
  private initStatus;
  /**
   * 处理 provider 状态变化
   * @param accounts 账户列表
   */
  private handleProviderStatusChange;
  /**
   * 更新钱包状态，通知监听器
   * @param status 钱包状态
   * @param account 账户信息
   */
  private updateStatus;
  /**
   * 通知所有状态变化监听器
   * @param status 钱包状态
   * @param account 账户信息
   */
  private notifyStatusChange;
  /**
   * 获取钱包连接状态
   * @returns 钱包状态
   */
  get status(): EthWalletStatus;
  /**
   * 获取当前连接的账户信息
   * @returns 账户信息
   */
  get account(): EthWalletAccount | null;
  /**
   * 获取是否已连接
   * @returns 是否已连接
   */
  get connected(): boolean;
  /**
   * 获取 MetaMask 深度链接
   * @returns MetaMask 深度链接
   */
  private getMetaMaskDeepLink;
  /**
   * 添加状态变化监听器
   * @param handler 状态变化监听器
   */
  addStatusChangeListener(handler: (status: EthWalletStatus, account?: EthWalletAccount | null) => void): void;
  /**
   * 移除状态变化监听器
   * @param handler 状态变化监听器
   */
  removeStatusChangeListener(handler: (status: EthWalletStatus, account?: EthWalletAccount | null) => void): void;
  /**
   * 连接钱包
   * @param deeplinkUrl 可选，移动端唤起钱包的deeplink，不传则自动构造
   */
  connect(deeplinkUrl?: string): Promise<void>;
  /**
   * 断开钱包连接
   */
  disconnect(): Promise<void>;
  /**
   * 销毁 Wallet 单例实例
   */
  static destroy(): void;
  /**
   * 发送最基础的 ETH 转账交易
   * @param to 接收地址
   * @param amount 转账金额
   * @param unit 单位（可选，默认为 'ether'，也可为 'wei'）
   * @returns 交易哈希
   */
  sendTransaction(to: string, amount: string | number, unit?: 'ether' | 'wei'): Promise<string>;
  /**
   * 初始化智能合约
   * @param contractABI 合约 ABI
   * @param contractAddress 合约地址
   * @returns 合约实例
   */
  initContract(contractABI: AbiItem[], contractAddress: string): Contract<AbiItem[]>;
  /**
   * 获取已初始化的合约实例
   * @param contractAddress 合约地址
   * @returns 合约实例，如果未初始化则返回 undefined
   */
  getContract(contractAddress: string): Contract<AbiItem[]> | undefined;
  /**
   * 清除合约实例缓存
   * @param contractAddress 可选的合约地址，如果不提供则清除所有缓存
   */
  clearContractCache(contractAddress?: string): void;
  /**
   * 根据 chainId 获取网络名称
   */
  private getChainName;
  /**
   * 将 chainId 统一转换为十六进制格式
   * @param chainId 链 ID（可以是数字或十六进制字符串）
   * @returns 十六进制格式的 chainId
   */
  private formatChainId;
  /**
   * 切换网络
   * @param chainId 目标网络的 chainId
   * @param networkInfo 网络信息（仅在需要添加网络时使用）
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
   * 获取当前链 ID
   */
  get currentChainId(): Promise<string>;
  /**
   * 获取当前网络信息
   */
  getNetworkInfo(): Promise<{
    chainId: string;
    chainName?: string;
  }>;
  /**
   * 切换到自定义网络
   * @param chainId 目标网络的 chainId
   * @param networkInfo 网络信息
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