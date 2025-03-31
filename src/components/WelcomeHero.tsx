"use client";

import { useAuth } from "@/hooks/useAuth";
import { formatAddress } from "@/lib/utils";
import { useEnsName } from "wagmi";

export function WelcomeHero() {
  const { address, isAuthenticated, isConnected } = useAuth();
  const { data: ensName } = useEnsName({ address: address as `0x${string}` });

  const displayName = ensName || (address ? formatAddress(address) : "");

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-800 mb-4">
          {isConnected && isAuthenticated ? (
            <>
              歡迎 <span className="text-indigo-600">{displayName}</span>
            </>
          ) : (
            "歡迎使用"
          )}
        </h1>

        {!isConnected && (
          <p className="text-gray-600 mb-4">
            請連接您的錢包以開始使用我們的服務
          </p>
        )}

        {isConnected && !isAuthenticated && (
          <p className="text-gray-600 mb-4">請完成認證以解鎖更多功能</p>
        )}

        {isAuthenticated && (
          <div className="mt-6 p-4 bg-white bg-opacity-50 rounded-lg inline-block">
            <p className="text-sm text-gray-600">
              您已成功登入並可以使用所有功能
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
