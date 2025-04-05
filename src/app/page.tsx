"use client";

import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "@/components/user/LoginScreen";
import { TokenBalances } from "@/components/user/TokenBalances";
import { Loader2 } from "lucide-react";
export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        {isAuthenticated ? (
          // 已登入狀態 - 顯示正常介面
          <div className="space-y-8">
            <TokenBalances />
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
