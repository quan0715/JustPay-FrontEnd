"use client";

import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "@/components/user/LoginScreen";
import { TokenBalances } from "@/components/user/TokenBalances";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        {isAuthenticated ? (
          // 已登入狀態 - 顯示正常介面
          <div className="space-y-8">
            <TokenBalances />

            <div className="flex flex-col gap-4 pt-6">
              <h2 className="text-xl font-bold">功能快速訪問</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/transfer">
                  <Button className="w-full h-20 text-lg" variant="outline">
                    跨鏈轉賬
                  </Button>
                </Link>
                <Link href="/transactions">
                  <Button className="w-full h-20 text-lg" variant="outline">
                    交易記錄
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : (
          <LoginScreen />
        )}
      </div>
    </main>
  );
}
