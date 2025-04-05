import { useSession } from "next-auth/react";
import { useAccount, useSignMessage } from "wagmi";

export function useAuth() {
  const { data: session, status } = useSession();
  const { address: walletAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  return {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    address: session?.address || walletAddress,
    isConnected,
    signMessageAsync,
  };
}
