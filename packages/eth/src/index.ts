import Web3, { type Contract, type AbiItem, type EIP1193Provider } from 'web3';
import { EthWalletStatus as WalletStatus, type EthWalletAccount as WalletAccount } from './types';

declare global {
  interface Window {
    ethereum?: EIP1193Provider<unknown>;
  }
}

export class Wallet {
  /** web3 实例 */
  private web3: Web3 | null = null;
  /** 单例实例 */
  private static instance: Wallet | null = null;
  /** 以太坊 provider */
  private provider?: EIP1193Provider<unknown>;
  /** 钱包连接状态 */
  private _status: WalletStatus = WalletStatus.DISCONNECTED;

  /** 当前连接的账户信息 */
  private _account: WalletAccount | null = null;

  /** 状态变化监听器集合 */
  private statusChangeHandlers: Set<(status: WalletStatus, account?: WalletAccount | null) => void> = new Set();

  /** 已初始化的合约实例缓存 */
  private contractInstances: Map<string, Contract<AbiItem[]>> = new Map();

  /**
   * 构造函数
   * @param options 以太坊钱包配置选项
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
   * 获取单例实例
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
    // 当网络变化时，重新初始化状态
    this.initStatus();
  };

  /**
   * 绑定 provider 的事件
   */
  private bindProviderEvents() {
    this.provider?.on?.('accountsChanged', this.handleAccountsChanged);
    this.provider?.on?.('disconnect', this.handleDisconnect);
    this.provider?.on?.('chainChanged', this.handleChainChanged);
  }

  /**
   * 移除 provider 的事件
   */
  private unbindProviderEvents() {
    this.provider?.removeListener?.('accountsChanged', this.handleAccountsChanged);
    this.provider?.removeListener?.('disconnect', this.handleDisconnect);
    this.provider?.removeListener?.('chainChanged', this.handleChainChanged);
  }
  /**
   * 初始化钱包连接状态
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
   * 处理 provider 状态变化
   * @param accounts 账户列表
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
   * 更新钱包状态，通知监听器
   * @param status 钱包状态
   * @param account 账户信息
   */
  private updateStatus(status: WalletStatus, account: WalletAccount | null) {
    this._status = status;
    this._account = account;

    // 本地缓存保存当前状态和账户地址
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
   * 通知所有状态变化监听器
   * @param status 钱包状态
   * @param account 账户信息
   */
  private notifyStatusChange(status: WalletStatus, account: WalletAccount | null) {
    this.statusChangeHandlers.forEach(handler => {
      try {
        handler(status, account);
      } catch (error) {
        console.warn('钱包状态变化监听器执行出错:', error);
      }
    });
  }

  /**
   * 获取钱包连接状态
   * @returns 钱包状态
   */
  get status(): WalletStatus {
    return this._status;
  }

  /**
   * 获取当前连接的账户信息
   * @returns 账户信息
   */
  get account(): WalletAccount | null {
    return this._account;
  }

  /**
   * 获取是否已连接
   * @returns 是否已连接
   */
  get connected(): boolean {
    return this._status === WalletStatus.CONNECTED && this._account !== null;
  }

  /**
   * 获取 MetaMask 深度链接
   * @returns MetaMask 深度链接
   */
  private getMetaMaskDeepLink(): string {
    if (typeof window === 'undefined') {
      throw new Error('Not running in a browser environment');
    }
    const host = window.location.host;
    // 这里只用 host，避免路径问题
    return `https://metamask.app.link/dapp/${host}`;
  }

  /**
   * 添加状态变化监听器
   * @param handler 状态变化监听器
   */
  public addStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void) {
    this.statusChangeHandlers.add(handler);
  }

  /**
   * 移除状态变化监听器
   * @param handler 状态变化监听器
   */
  public removeStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void) {
    this.statusChangeHandlers.delete(handler);
  }

  /**
   * 连接钱包
   * @param deeplinkUrl 可选，移动端唤起钱包的deeplink，不传则自动构造
   */
  public async connect(deeplinkUrl?: string): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Not running in a browser environment');
    }
    if (window.ethereum) {
      try {
        // 先请求权限，这会强制弹出 MetaMask
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        const response = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = response as unknown as string[];
        localStorage.setItem('ethWalletExplicitlyConnected', 'true');
        this.handleProviderStatusChange(accounts);
      } catch (error) {
        console.error('连接钱包失败或用户拒绝:', error);
        throw error;
      }
    } else {
      const url = deeplinkUrl ?? this.getMetaMaskDeepLink();
      window.location.href = url;
      // 用户会被跳转去钱包APP内置浏览器打开dapp，后续用户操作
    }
  }

  /**
   * 断开钱包连接
   */
  public async disconnect(): Promise<void> {
    try {
      // 清理本地状态
      this._account = null;
      this.updateStatus(WalletStatus.DISCONNECTED, null);

      // 移除事件监听
      this.unbindProviderEvents();

      // 清理本地存储
      localStorage.removeItem('ethWalletStatus');
      localStorage.removeItem('ethWalletAccount');
    } catch (error) {
      console.warn('断开钱包连接时出错:', error);
    }
  }

  /**
   * 销毁 Wallet 单例实例
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
   * 发送最基础的 ETH 转账交易
   * @param to 接收地址
   * @param amount 转账金额
   * @param unit 单位（可选，默认为 'ether'，也可为 'wei'）
   * @returns 交易哈希
   */
  public async sendTransaction(to: string, amount: string | number, unit: 'ether' | 'wei' = 'ether'): Promise<string> {
    if (!this.connected || !this._account) {
      throw new Error('钱包未连接');
    }
    if (!this.web3) {
      throw new Error('web3 实例不存在');
    }
    if (!this.provider) {
      throw new Error('provider 不存在');
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
        throw new Error('交易哈希格式错误');
      }

      return response.result;
    } catch (error) {
      console.error('发送 ETH 交易失败:', error);
      throw error;
    }
  }

  /**
   * 初始化智能合约
   * @param contractABI 合约 ABI
   * @param contractAddress 合约地址
   * @returns 合约实例
   */
  public initContract(contractABI: AbiItem[], contractAddress: string): Contract<AbiItem[]> {
    if (!this.web3) {
      throw new Error('web3 实例不存在');
    }

    // 检查是否已经初始化过该合约
    const cacheKey = `${contractAddress.toLowerCase()}`;
    const cachedContract = this.contractInstances.get(cacheKey);
    if (cachedContract) {
      return cachedContract;
    }

    try {
      // 创建新的合约实例
      const contract = new this.web3.eth.Contract(contractABI, contractAddress);

      // 缓存合约实例
      this.contractInstances.set(cacheKey, contract);

      return contract;
    } catch (error) {
      console.error('初始化智能合约失败:', error);
      throw error;
    }
  }

  /**
   * 获取已初始化的合约实例
   * @param contractAddress 合约地址
   * @returns 合约实例，如果未初始化则返回 undefined
   */
  public getContract(contractAddress: string): Contract<AbiItem[]> | undefined {
    const cacheKey = `${contractAddress.toLowerCase()}`;
    return this.contractInstances.get(cacheKey);
  }

  /**
   * 清除合约实例缓存
   * @param contractAddress 可选的合约地址，如果不提供则清除所有缓存
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
   * 根据 chainId 获取网络名称
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
   * 将 chainId 统一转换为十六进制格式
   * @param chainId 链 ID（可以是数字或十六进制字符串）
   * @returns 十六进制格式的 chainId
   */
  private formatChainId(chainId: string | number): string {
    // 检查 chainId 是否为 null 或 undefined
    if (chainId == null) {
      throw new Error('chainId 不能为空');
    }

    // 如果是对象类型，尝试获取其 chainId 属性
    if (typeof chainId === 'object') {
      if ('chainId' in chainId) {
        chainId = (chainId as Record<string, unknown>).chainId as string | number;
      } else {
        throw new Error('无效的 chainId 格式');
      }
    }

    // 处理数字类型
    if (typeof chainId === 'number') {
      return `0x${chainId.toString(16)}`;
    }

    // 处理字符串类型
    if (typeof chainId === 'string') {
      // 如果已经是十六进制字符串，确保有 0x 前缀
      if (chainId.startsWith('0x')) {
        return chainId.toLowerCase();
      }
      // 如果是数字字符串，转换为十六进制
      const num = parseInt(chainId);
      if (isNaN(num)) {
        throw new Error('无效的 chainId 格式');
      }
      return `0x${num.toString(16)}`;
    }

    throw new Error('无效的 chainId 格式');
  }

  /**
   * 切换网络
   * @param chainId 目标网络的 chainId
   * @param networkInfo 网络信息（仅在需要添加网络时使用）
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
      throw new Error('provider 不存在');
    }

    const formattedChainId = this.formatChainId(chainId);

    try {
      // 尝试切换网络
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: formattedChainId }]
      });
    } catch (error: unknown) {
      // 如果错误码是 4902，说明网络未添加
      if ((error as { code?: number }).code === 4902 && networkInfo) {
        try {
          // 尝试添加网络
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
          console.error('添加网络失败:', addError);
          throw new Error('添加网络失败，请手动添加网络');
        }
      } else {
        console.error('切换网络失败:', error);
        throw new Error('切换网络失败');
      }
    }
  }

  /**
   * 获取当前链 ID
   */
  get currentChainId(): Promise<string> {
    if (!this.provider) {
      throw new Error('provider 不存在');
    }
    return this.provider.request({ method: 'eth_chainId' }).then((response: unknown) => response as string);
  }

  /**
   * 获取当前网络信息
   */
  public async getNetworkInfo(): Promise<{
    chainId: string;
    chainName?: string;
  }> {
    if (!this.provider) {
      throw new Error('provider 不存在');
    }

    try {
      const chainId = await this.currentChainId;
      return {
        chainId,
        chainName: this.getChainName(chainId)
      };
    } catch (error) {
      console.error('获取网络信息失败:', error);
      throw new Error('获取网络信息失败');
    }
  }

  /**
   * 切换到自定义网络
   * @param chainId 目标网络的 chainId
   * @param networkInfo 网络信息
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
      throw new Error('provider 不存在');
    }

    const formattedChainId = this.formatChainId(chainId);

    try {
      // 尝试切换网络
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: formattedChainId }]
      });
    } catch (error: unknown) {
      // 如果错误码是 4902，说明网络未添加
      if ((error as { code?: number }).code === 4902) {
        try {
          // 尝试添加网络
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
          console.error('添加网络失败:', addError);
          throw new Error('添加网络失败，请手动添加网络');
        }
      } else {
        console.error('切换网络失败:', error);
        throw new Error('切换网络失败');
      }
    }
  }
}

// 导出类型定义
export * from './types';
