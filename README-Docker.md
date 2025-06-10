# JustPay Docker 部署指南

這個項目包含完整的 Docker 化部署，包括 Next.js 主應用程式和區塊鏈監聽服務。

## 🏗️ 架構概覽

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Blockchain Listener │    │   MongoDB       │
│   (Port: 3000)  │◄──►│  Service             │◄──►│   (Port: 27017) │
│                 │    │  (Background)        │    │                 │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
        │                         │
        ▼                         ▼
┌─────────────────┐    ┌──────────────────────┐
│   Nginx Proxy   │    │   Blockchain         │
│   (Port: 80)    │    │   (USDC + Aave)      │
└─────────────────┘    └──────────────────────┘
```

## 🚀 快速開始

### 1. 環境準備

確保您的系統已安裝：

- Docker (版本 20.0+)
- Docker Compose (版本 2.0+)

### 2. 設置環境變量

```bash
# 複製環境變量模板
cp env.docker env.docker.local

# 編輯環境變量
nano env.docker.local
```

**使用 Alchemy 的優勢：**

- ✅ 一個 API Key 支援所有測試網（Sepolia、Base Sepolia、Avalanche Fuji）
- ✅ 更穩定的連接和更高的請求限制
- ✅ 內建負載均衡和容錯機制
- ✅ 免費計劃已足夠開發和測試使用

**重要配置項：**

```bash
# Alchemy API Key (推薦) - 一個 key 支援所有鏈
# 請到 https://alchemy.com 註冊並取得 API Key
ALCHEMY_API_KEY=your_alchemy_api_key_here

# 或者使用個別的 RPC URLs (備用選項)
# RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
# RPC_URL_BASE_SEPOLIA=https://sepolia.base.org
# RPC_URL_FUJI=https://api.avax-test.network/ext/bc/C/rpc

# Aave 操作私鑰 - 請使用專門的錢包地址！
AAVE_PRIVATE_KEY=0x...
```

### 3. 測試 Alchemy 連接（可選）

```bash
# 測試 Alchemy API Key 是否正常運作
chmod +x scripts/test-alchemy.sh
./scripts/test-alchemy.sh
```

### 4. 部署服務

```bash
# 使用部署腳本（會自動執行 Alchemy 測試）
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 或手動部署
docker-compose --env-file env.docker up -d --build
```

### 5. 驗證部署

訪問：

- **主應用程式**: http://localhost:3000
- **Nginx 代理**: http://localhost:80
- **MongoDB**: localhost:27017

## 📊 服務說明

### Next.js 主應用程式

- **容器名**: `justpay-nextjs`
- **端口**: 3000
- **功能**: Web 界面、用戶管理、收款頁面

### 區塊鏈監聽服務

- **容器名**: `justpay-blockchain-listener`
- **功能**:
  - 監聽 USDC Transfer 事件
  - 檢測 JustPay 用戶收款
  - 自動執行 Aave 質押
  - 更新用戶餘額

### MongoDB 數據庫

- **容器名**: `justpay-mongo`
- **端口**: 27017
- **數據存儲**:
  - 用戶信息
  - 交易記錄
  - 事件日誌

### Nginx 反向代理

- **容器名**: `justpay-nginx`
- **端口**: 80, 443
- **功能**: 負載均衡、SSL 終止

## 🔧 管理命令

### 查看服務狀態

```bash
docker-compose --env-file env.docker ps
```

### 查看日誌

```bash
# 所有服務日誌
docker-compose --env-file env.docker logs -f

# 特定服務日誌
docker-compose --env-file env.docker logs -f nextjs-app
docker-compose --env-file env.docker logs -f blockchain-listener
docker-compose --env-file env.docker logs -f mongo
```

### 重啟服務

```bash
# 重啟所有服務
docker-compose --env-file env.docker restart

# 重啟特定服務
docker-compose --env-file env.docker restart blockchain-listener
```

### 更新服務

```bash
# 停止服務
docker-compose --env-file env.docker down

# 重新構建並啟動
docker-compose --env-file env.docker up -d --build
```

## 🛡️ 安全注意事項

### 1. 私鑰管理

- **永遠不要**在生產環境中使用示例私鑰
- 使用專門的錢包地址進行 Aave 操作
- 定期輪換私鑰
- 監控錢包餘額

### 2. 網路安全

- 僅在生產環境中暴露必要端口
- 使用防火牆限制訪問
- 定期更新系統和依賴

### 3. 環境變量

- 使用強密碼
- 不要在代碼中硬編碼敏感信息
- 定期審查環境變量配置

## 🚨 故障排除

### 常見問題

1. **MongoDB 連接失敗**

   ```bash
   # 檢查 MongoDB 容器狀態
   docker logs justpay-mongo
   ```

2. **區塊鏈 RPC 連接問題**

   ```bash
   # 測試 Alchemy RPC 連接
   curl -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
   ```

3. **Aave 交易失敗**

   ```bash
   # 查看監聽服務日誌
   docker logs justpay-blockchain-listener | grep "Aave"
   ```

---

**⚠️ 免責聲明**: 這是測試網環境的配置。生產環境部署前請進行充分的安全審計。
