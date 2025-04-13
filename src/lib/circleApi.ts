/**
 * Circle API 服務 - 提供與 Circle API 交互的功能
 * 請求限制為每秒最多10次
 */

// Circle API 端點
const CIRCLE_API_BASE_URL = "https://iris-api-sandbox.circle.com/v2/messages";

// 請求頻率限制控制
class RateLimiter {
  private tokens: number;
  private lastRefillTimestamp: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // 每毫秒填充的令牌數

  constructor(maxRequests: number, perSecond: number = 1) {
    this.tokens = maxRequests;
    this.maxTokens = maxRequests;
    this.refillRate = maxRequests / (perSecond * 1000); // 轉換為每毫秒
    this.lastRefillTimestamp = Date.now();
  }

  async getToken(): Promise<boolean> {
    this.refill();

    if (this.tokens < 1) {
      // 如果沒有足夠的令牌，等待至少100毫秒
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.refill();

      // 如果還是不夠，返回失敗
      if (this.tokens < 1) {
        return false;
      }
    }

    this.tokens -= 1;
    return true;
  }

  private refill() {
    const now = Date.now();
    const timeElapsed = now - this.lastRefillTimestamp;

    // 計算應該添加的令牌數量
    const tokensToAdd = timeElapsed * this.refillRate;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.tokens + tokensToAdd, this.maxTokens);
      this.lastRefillTimestamp = now;
    }
  }
}

// 創建一個全局的請求限制器（每秒10次請求）
const apiRateLimiter = new RateLimiter(10);

// 交易狀態類型
export type CircleTransactionStatus =
  | "draft"
  | "pending"
  | "complete"
  | "pending_confirmations"
  | "failed"
  | "confirmed";

// 交易詳細資訊
export interface CircleTransactionDetails {
  status: CircleTransactionStatus;
  attestation: string;
  message: string;
}

/**
 * 發送API請求，同時遵守頻率限制
 */
async function makeRateLimitedRequest(url: string, options: RequestInit) {
  // 嘗試獲取請求令牌
  const canProceed = await apiRateLimiter.getToken();
  if (!canProceed) {
    throw new Error("API請求頻率超限，請稍後再試");
  }

  return fetch(url, options);
}

/**
 * 取得交易狀態
 * @param transactionId Circle 交易 ID
 * @returns 交易狀態詳細資訊
 */
export async function getTransactionStatus(
  domain: number,
  transactionId: string
): Promise<CircleTransactionDetails | null> {
  try {
    console.log("getTransactionStatus", domain, transactionId);
    console.log(
      `${CIRCLE_API_BASE_URL}/${domain}?transactionHash=${transactionId}`
    );

    const response = await makeRateLimitedRequest(
      `${CIRCLE_API_BASE_URL}/${domain}?transactionHash=${transactionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // console.error("Circle API 回應錯誤:", response);
      return {
        status: "draft",
        attestation: "",
        message: "",
      };
    }

    const data = await response.json();

    // 將 Circle API 回應轉換為我們的標準格式
    return {
      status: data.messages[0].status,
      attestation: data.messages[0].attestation,
      message: data.messages[0].message,
    };
  } catch (error) {
    console.error("取得 Circle 交易狀態失敗:", error);
    return null;
  }
}
