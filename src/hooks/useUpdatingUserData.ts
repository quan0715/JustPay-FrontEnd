import { useState } from "react";
import { updateUserData } from "@/app/_actions/userRepo";
import User from "@/models/user";
export default function useUpdatingUserData() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (userData: User) => {
    setIsUpdating(true);
    setError(null);
    try {
      await updateUserData(userData);
    } catch (error) {
      setError(error as string);
    } finally {
      setIsUpdating(false);
    }
  };

  return { isUpdating, error, updateUser };
}
