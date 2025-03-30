import { useAuth } from "@/hooks/useAuth";
import { formatAddress } from "@/lib/utils";

export function AuthStatus() {
  const { isAuthenticated, isLoading, address, isConnected } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
        <span>載入中...</span>
      </div>
    );
  }

  if (!isConnected) {
    return <div className="text-sm text-gray-500">請連接錢包</div>;
  }

  if (!isAuthenticated) {
    return <div className="text-sm text-gray-500">請簽署消息以登入</div>;
  }

  return (
    <div className="flex flex-col space-y-1">
      <div className="text-sm font-medium text-gray-900">已成功登入</div>
      <div className="text-xs text-gray-500">
        錢包地址: {formatAddress(address)}
      </div>
    </div>
  );
}
