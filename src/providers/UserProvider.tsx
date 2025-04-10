"use client";
import { createContext } from "react";
import User from "@/models/user";
import { useUserData } from "@/hooks/useUserData";
import { Loader2 } from "lucide-react";

interface UserContextType {
  userData: User | null;
  isLoadingUserData: boolean;
  //   setUserData: (userData: UserData) => void;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: userData, isLoading: isLoadingUserData } = useUserData();

  return (
    <UserContext.Provider value={{ userData, isLoadingUserData }}>
      {isLoadingUserData ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
}
