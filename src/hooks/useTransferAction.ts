import { useState, useTransition } from "react";
import { getSignatureTransaction } from "@/app/_actions/transationRepo";
import { USDCTransferTransactionModel } from "@/models/transaction";

export function useTransferAction() {
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<USDCTransferTransactionModel | null>(null);

  async function getData(dataId: string) {
    try {
      startTransition(async () => {
        const response = await getSignatureTransaction({ id: dataId });
        setData(response);
      });
    } catch (error) {
      setError(error as string);
    }
  }

  return {
    isLoading,
    error,
    data,
    getData,
  };
}
