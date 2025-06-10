# JustPay 本地開發指南

這是 JustPay 的本地開發環境設置指南，不需要使用 Docker。

## 🚀 快速開始

### 1. 環境要求

- Node.js 18+
- npm 或 yarn
- MongoDB (本地安裝或使用雲端服務)

### 2. 安裝依賴

```bash
# 安裝主應用程式依賴
npm install

# 如果需要使用區塊鏈監聽功能，可以稍後添加
```

### 3. 環境變數設置

創建 `.env.local` 文件：

```bash
# 複製環境變數範例
cp .env.local.example .env.local
```

在 `.env.local` 中設置：

```env
# Alchemy API Key (推薦)
ALCHEMY_API_KEY=your_alchemy_api_key_here

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# MongoDB 連接
DATABASE_URL=mongodb://localhost:27017/justpay
# 或使用雲端 MongoDB
# DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/justpay

# 可選：個別 RPC URLs (如果不使用 Alchemy)
# RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
# RPC_URL_BASE_SEPOLIA=https://sepolia.base.org
# RPC_URL_FUJI=https://api.avax-test.network/ext/bc/C/rpc
```

### 4. 啟動開發服務器

```bash
# 啟動 Next.js 開發服務器
npm run dev
```

應用程式將在 http://localhost:3000 上運行。

## 🔧 主要功能

### 🎯 收款 QR 碼生成

- 訪問 `/receive` 頁面
- 選擇區塊鏈網路
- 輸入金額和備註（可選）
- 生成 QR 碼供他人掃描付款

### 💸 跨鏈轉帳

- 訪問 `/transfer` 頁面
- 連接錢包
- 選擇來源和目標鏈
- 輸入收款地址和金額
- 執行跨鏈轉帳

### 📋 ERC20 直接轉帳

- 在交易詳情頁面中
- 當交易狀態不是 pending 時
- 可以使用 ERC20 轉帳按鈕
- 直接轉帳 USDC 到指定錢包

## 🛠️ 開發工具

### 代碼檢查

```bash
npm run lint
```

### 類型檢查

```bash
npm run type-check
```

### 構建應用程式

```bash
npm run build
```

## 🌐 支援的網路

目前支援以下測試網：

- **Ethereum Sepolia** (Chain ID: 11155111)
- **Base Sepolia** (Chain ID: 84532)
- **Avalanche Fuji** (Chain ID: 43113)

## 📁 項目結構

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── receive/           # 收款 QR 碼頁面
│   ├── transfer/          # 轉帳頁面
│   └── api/               # API 路由
├── components/            # React 組件
│   ├── transaction/       # 交易相關組件
│   ├── ui/               # UI 基礎組件
│   └── dappComponent/    # DApp 專用組件
├── hooks/                # 自定義 React Hooks
├── lib/                  # 工具函數
├── models/               # 數據模型
└── providers/            # Context Providers
```

## 🔐 錢包整合

項目使用 RainbowKit + wagmi 進行錢包連接：

- 支援主流錢包（MetaMask、WalletConnect 等）
- 自動網路切換
- 交易狀態監控

## 🧪 測試

### 測試 Alchemy 連接

如果使用 Alchemy API Key，可以測試連接：

```bash
# 創建測試腳本
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY');
provider.getBlockNumber().then(console.log);
"
```

## 🚨 常見問題

### 1. MongoDB 連接失敗

```bash
# 確保 MongoDB 服務正在運行
mongod

# 或使用 MongoDB Atlas 雲端服務
```

### 2. RPC 連接問題

- 檢查 Alchemy API Key 是否正確
- 確認網路連接正常
- 檢查 API 配額是否用完

### 3. 錢包連接問題

- 確保錢包已安裝並解鎖
- 檢查是否在正確的網路上
- 清除瀏覽器緩存並重試

## 📚 相關資源

- [Next.js 文檔](https://nextjs.org/docs)
- [RainbowKit 文檔](https://rainbowkit.com/docs/installation)
- [Alchemy 文檔](https://docs.alchemy.com/)
- [ethers.js 文檔](https://docs.ethers.org/)

---

**🎉 現在您可以開始本地開發了！**
