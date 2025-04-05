"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserData } from "@/app/_actions/userDataAction";
import User from "@/models/user";

// 用戶數據介面
export interface UseUserDataResponse {
  address: string | undefined;
  data: User | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useUserData(): UseUserDataResponse {
  const { address, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      if (!address || !isAuthenticated) return;
      setIsLoading(true);
      const userData = await getUserData(address);
      console.log("userData", userData);
      if (!userData) {
        setUserData(null);
      } else {
        setUserData(userData);
      }
    } catch (error) {
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新數據
  const refreshData = async () => {
    await fetchUserData();
  };

  // 當地址或認證狀態變化時，獲取餘額
  useEffect(() => {
    if (address && isAuthenticated) {
      fetchUserData();
    }
  }, [address, isAuthenticated]);

  return {
    address,
    data: userData,
    isLoading,
    error,
    refreshData,
  };
}
