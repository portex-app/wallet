import { TonConnectUI, type TonProofItemReply, type Wallet as TonConnectWallet } from '@tonconnect/ui';
import { toNano, beginCell, Address } from '@ton/core';
import { Buffer } from 'buffer';
import { TonWalletStatus as WalletStatus, type TonWalletAccount as WalletAccount } from './types';
window.Buffer = Buffer;

// TON API 返回的 Jetton 钱包信息类型
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

// 缓存中存储的 Jetton 钱包信息类型
type JettonWalletCacheItem = TonApiJettonWalletResponse;

// calculateJettonWalletAddress 方法的返回类型
interface JettonWalletInfo {
  address: string;
  decimals: number;
}
/**
 * 将人类可读的金额转换为最小的单位
 * @param src 人类可读的金额
 * @param decimals 小数位数
 * @returns 最小的单位
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
  /** TonConnect UI 实例 */
  private tonConnectUI!: TonConnectUI;

  /** 单例实例 */
  private static instance: Wallet | null = null;

  /** 钱包连接状态 */
  private _status: WalletStatus = WalletStatus.DISCONNECTED;

  /** 当前连接的账户信息 */
  private _account: WalletAccount | null = null;

  /** 状态变化监听器集合 */
  private statusChangeHandlers: Set<(status: WalletStatus, account?: WalletAccount | null) => void> = new Set();

  /** Jetton钱包地址缓存 */
  private jettonWalletCache: Map<string, JettonWalletCacheItem> = new Map();

  /**
   * 构造函数
   * @param options TON 钱包配置选项
   */
  private constructor(options: { manifestUrl: string }) {
    this.tonConnectUI = new TonConnectUI({
      manifestUrl: options.manifestUrl
    });

    // 🍎 配置 iOS Universal Links 解决方案
    // 仅在 iOS 设备上应用，根据 TonConnect 官方建议
    // 防止在有异步操作时钱包无法正确打开
    // 参考: https://github.com/ton-connect/sdk/tree/main/packages/ui#universal-links-redirecting-issues-ios
    if (this.isIOSDevice()) {
      this.tonConnectUI.uiOptions = {
        actionsConfiguration: {
          skipRedirectToWallet: 'ios'
        }
      };
    }

    // 监听钱包状态变化
    this.tonConnectUI.onStatusChange(wallet => {
      console.log('update');
      this.handleTonConnectStatusChange(wallet);
    });
  }

  /**
   * 获取 Wallet 单例实例
   * @param manifestUrl TON Connect manifest URL
   * @returns Wallet 实例
   */
  public static getInstance(manifestUrl: string): Wallet {
    if (!Wallet.instance) {
      Wallet.instance = new Wallet({ manifestUrl });
    }
    return Wallet.instance;
  }

  /**
   * 检测是否为 iOS 设备
   * @returns 是否为 iOS 设备
   */
  private isIOSDevice(): boolean {
    if (typeof window === 'undefined' || !window.navigator) {
      return false;
    }

    const userAgent = window.navigator.userAgent;
    const platform = (window.navigator as Navigator & { platform?: string }).platform || '';

    // 检测 iOS 设备的多种方式
    return (
      /iPad|iPhone|iPod/.test(userAgent) ||
      (platform === 'MacIntel' && window.navigator.maxTouchPoints > 1) || // iPad Pro
      /iOS/.test(userAgent)
    );
  }

  /**
   * 处理 TonConnect 状态变化
   * @param wallet 钱包状态
   */
  private handleTonConnectStatusChange(wallet: TonConnectWallet | null) {
    if (wallet?.account) {
      const account: WalletAccount = {
        address: wallet.account.address,
        publicKey: wallet.account.publicKey || undefined,
        chainId: wallet.account.chain
      };
      this.updateStatus(WalletStatus.CONNECTED, account);
    } else {
      this.updateStatus(WalletStatus.DISCONNECTED, null);
    }
  }

  /**
   * 销毁当前实例（兼容旧API）
   * @deprecated 请直接调用实例的 destroy() 方法
   */
  public static destroy() {
    if (Wallet.instance) {
      Wallet.instance.destroy();
      Wallet.instance = null;
    }
  }

  /** 获取钱包连接状态 */
  get status(): WalletStatus {
    return this._status;
  }

  /** 获取当前连接的账户信息 */
  get account(): WalletAccount | null {
    return this._account;
  }

  /** 获取是否已连接 */
  get connected(): boolean {
    return this._status === WalletStatus.CONNECTED && this._account !== null;
  }

  /**
   * 获取原始 TonConnect 钱包实例
   * @returns 当前连接的钱包实例，如果未连接则返回 undefined
   */
  get wallet() {
    return this.tonConnectUI.wallet;
  }

  /**
   * 获取当前连接的 TonConnect 账户信息
   * @returns 当前连接的账户信息，如果未连接则返回 undefined
   */
  get tonAccount() {
    return this.tonConnectUI.account;
  }

  /**
   * 获取当前连接的钱包地址
   * @returns 当前连接的钱包地址，如果未连接则返回 undefined
   */
  get address() {
    return this.tonConnectUI.account?.address;
  }

  /**
   * 更新钱包状态
   * @param status 新状态
   * @param account 账户信息
   */
  private updateStatus(status: WalletStatus, account?: WalletAccount | null) {
    this._status = status;
    if (account !== undefined) {
      this._account = account;
    }
    this.notifyStatusChange(status, this._account);
  }

  /**
   * 通知所有监听器状态变化
   * @param status 新状态
   * @param account 账户信息
   */
  private notifyStatusChange(status: WalletStatus, account?: WalletAccount | null) {
    this.statusChangeHandlers.forEach(handler => {
      try {
        handler(status, account);
      } catch (error) {
        console.warn('钱包状态变化监听器执行出错:', error);
      }
    });
  }

  /**
   * 获取 TON Proof
   * @returns TON Proof 数据，如果未获取到则返回 null
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
   * 添加状态变化监听器
   * @param handler 监听器函数
   */
  addStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void): void {
    this.statusChangeHandlers.add(handler);
  }

  /**
   * 移除状态变化监听器
   * @param handler 监听器函数
   */
  removeStatusChangeListener(handler: (status: WalletStatus, account?: WalletAccount | null) => void): void {
    this.statusChangeHandlers.delete(handler);
  }

  /**
   * 销毁钱包实例
   */
  destroy(): void {
    if (this.tonConnectUI.connected) {
      this.tonConnectUI.disconnect();
    }
    this.tonConnectUI.closeModal();

    // 清空单例实例
    if (Wallet.instance === this) {
      Wallet.instance = null;
    }

    this.statusChangeHandlers.clear();
    this.jettonWalletCache.clear(); // 清理缓存
    this._status = WalletStatus.DISCONNECTED;
    this._account = null;
  }

  /**
   * 连接钱包
   */
  async connect(): Promise<void> {
    await this.tonConnectUI.openModal();
  }

  /**
   * 断开钱包连接
   */
  async disconnect(): Promise<void> {
    await this.tonConnectUI.disconnect();
  }

  /**
   * 发送 TON 交易
   * @param to 接收地址
   * @param amount 发送金额（TON）
   * @param message 可选的消息内容
   * @returns 交易哈希
   */
  async sendTransaction(to: string, amount: number, message?: string): Promise<string> {
    if (!this.connected) {
      throw new Error('钱包未连接');
    }
    if (!to || typeof to !== 'string' || to.trim() === '') {
      throw new Error('接收地址不能为空');
    }
    if (amount === undefined || amount === null || isNaN(amount) || Number(amount) <= 0) {
      throw new Error('发送金额必须为大于0的数字');
    }

    try {
      const nanoAmount = toNano(amount.toString());

      let cellPayload: string | undefined;
      if (message) {
        // 创建一个包含文本消息的Cell
        const cell = beginCell()
          .storeUint(0, 32) // 写入32个零位以表示后面将跟随文本评论
          .storeStringTail(message) // 写下我们的文本评论
          .endCell();

        // 将Cell转换为base64编码的BOC
        cellPayload = cell.toBoc().toString('base64');
      } else {
        cellPayload = undefined;
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5, // 5分钟超时
        messages: [
          {
            address: to,
            amount: nanoAmount.toString(),
            payload: cellPayload
          }
        ]
      };
      console.log('交易信息', transaction);
      const result = await this.tonConnectUI.sendTransaction(transaction);
      console.log('[DEBUG] sendTransaction 返回:', result);
      return result.boc;
    } catch (error) {
      console.error('发送交易失败:', error);
      throw error;
    }
  }

  /**
   * 发送 JETTON 代币交易
   * @param jettonMasterAddress JETTON主合约地址
   * @param to 接收地址
   * @param amount 发送金额（人类可读数量，自动转最小单位）
   * @param message 可选的消息内容
   * @param gasAmount 可选的gas费（TON），默认0.1
   * @returns 交易哈希
   */
  async sendJettonTransaction(jettonMasterAddress: string, to: string, amount: number, message?: string): Promise<string> {
    if (!this.connected) throw new Error('钱包未连接');
    if (!jettonMasterAddress) throw new Error('JETTON主合约地址不能为空');
    if (!to) throw new Error('接收地址不能为空');
    if (!amount || isNaN(amount) || Number(amount) <= 0) throw new Error('发送金额必须为大于0的数字');
    if (!this.address) throw new Error('无法获取当前钱包地址');

    try {
      console.log(this.tonConnectUI);
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
        .storeUint(0xf8a7ea5, 32) // Jetton转账操作码
        .storeUint(0, 64) // query_id
        .storeCoins(sendJettonTransactionAmount) // 转账的Jetton数量
        .storeAddress(Address.parse(to)) // 接收方地址
        .storeAddress(Address.parse(to)) // 响应地址(通常与发送方相同)
        .storeBit(0) // 无自定义负载
        .storeCoins(0) // 随转账发送的TON数量
        .storeBit(forwardPayloadCell ? 1 : 0) // 是否有附言
        .storeRef(forwardPayloadCell)
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5分钟有效期
        messages: [
          {
            address: jettonWalletAddress, // 使用发送方的Jetton钱包地址
            amount: toNano('0.1').toString(), // 足够的TON用于gas
            payload: jettonTransferBody.toBoc().toString('base64') // 消息体
          }
        ]
      };
      console.log('transaction', transaction);
      const result = await this.tonConnectUI.sendTransaction(transaction);
      console.log('Transaction sent:', result);
      return result.boc;
    } catch (error) {
      console.error('[JETTON][ERROR] 发送JETTON交易失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前网络类型
   * @returns 'mainnet' | 'testnet'
   */
  getNetwork(): 'mainnet' | 'testnet' {
    const chain = this.tonConnectUI.account?.chain;
    return chain === '-3' ? 'testnet' : 'mainnet';
  }

  /**
   * 获取Jetton钱包地址
   * @param jettonMasterAddress Jetton主合约地址
   * @param ownerAddress 用户钱包地址
   * @returns Jetton钱包地址
   */
  async calculateJettonWalletAddress(jettonMasterAddress: string, ownerAddress: string): Promise<JettonWalletInfo> {
    // 生成缓存键
    const cacheKey = `${jettonMasterAddress}_${ownerAddress}`;

    // 检查缓存是否存在
    const cached = this.jettonWalletCache.get(cacheKey);
    if (cached) {
      console.log('[CACHE] 使用缓存的Jetton钱包地址:', cacheKey);
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
        throw new Error('获取Jetton钱包地址失败');
      }

      const result = {
        address: data.wallet_address.address,
        decimals: data.jetton.decimals
      };

      // 将查询结果缓存到内存里
      this.jettonWalletCache.set(cacheKey, {
        ...data
      });

      console.log('[CACHE] 缓存Jetton钱包地址:', cacheKey, result);

      return result;
    } catch (error) {
      console.error('获取Jetton钱包地址失败:', error);
      throw error;
    }
  }
}

// 导出类型定义
export * from './types';
