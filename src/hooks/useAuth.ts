import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";

export function useAuth() {
  const { data: session, status } = useSession();
  const { address: walletAddress, isConnected } = useAccount();

  return {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    address: session?.address || walletAddress,
    isConnected,
  };
}
