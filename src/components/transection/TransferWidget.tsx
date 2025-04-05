// build transfer widget
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ChainToken, getChainTokenDataByName } from "@/models/token";
import { Key, KeyValueDataCard, Value, Action } from "../key-value-data-card";
import { useUserTokenBalance } from "@/hooks/useUserTokenBalance";
import { useWalletClient } from "wagmi";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { ConfirmTransactionDialog } from "./ConfirmTransactionDialog";
import { SignResult } from "@/hooks/useJustPaySign";
import { ChainChip } from "../dappComponent/ChainChip";
import { ChainTokenList } from "@/models/token";
import { SignProxyOffChainTransaction } from "@/models/transaction";

export function TransferWidget() {
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [recipientTargetChain, setRecipientTargetChain] = useState<string>(
    ChainTokenList[0].network
  );
  const { data: walletClient } = useWalletClient();
  const { data: userData, isLoading: isLoadingUserData } = useUserData();
  const { totalBalance } = useUserTokenBalance();

  // 確認對話框狀態
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [transactionSignData, setTransactionSignData] =
    useState<SignProxyOffChainTransaction | null>(null);

  // 驗證輸入金額
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 允許空值或有效的數字輸入
    if (value === "" || /^\d*\.?\d{0,6}$/.test(value)) {
      setAmount(value);
    }
  };

  // 打開確認對話框
  const handleOpenConfirmDialog = () => {
    if (!userData?.allowances) {
      toast.error("請先添加允許網絡");
      return;
    }
    if (
      !amount ||
      parseFloat(amount) <= 0 ||
      !recipientAddress ||
      !recipientTargetChain
    ) {
      toast.error("請填寫完整轉賬資訊");
      return;
    }

    // 獲取目標鏈的資訊
    const destinationChain = getChainTokenDataByName(recipientTargetChain);
    if (!destinationChain) {
      toast.error("目標鏈資訊無效");
      return;
    }
    const sourceChainIds = userData?.allowances
      .filter(
        (allowance) =>
          getChainTokenDataByName(allowance.chainName) !== undefined
      )
      .map((allowance) => getChainTokenDataByName(allowance.chainName));

    // 設置交易數據
    setTransactionSignData({
      senderAddress: walletClient?.account.address || "",
      recipientAddress,
      amount,
      sourceChain: sourceChainIds as ChainToken[],
      destinationChain,
    });

    // 打開對話框
    setDialogOpen(true);
  };

  // 交易完成後處理
  const handleTransactionCompleted = (result: SignResult) => {
    // 清空輸入
    setAmount("");
    setRecipientTargetChain("");

    // 顯示成功消息
    toast.success("交易已提交至處理隊列");
    console.log("交易完成，簽名結果:", result);

    // 延遲關閉對話框
    setTimeout(() => {
      setDialogOpen(false);
      setTransactionSignData(null);
    }, 1000);
  };

  const isAmountValid = () => {
    if (parseFloat(amount) > parseFloat(totalBalance)) {
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6 max-w-screen-sm mx-auto">
      <div className="w-full flex flex-col gap-4 justify-center items-center">
        <TransferWidgetSection title="Sender">
          <KeyValueDataCard
            isLoading={isLoadingUserData}
            orientation="horizontal"
          >
            <Key>{"Allowance Network"}</Key>
            <Value>
              <div className="flex flex-row gap-2">
                {userData?.allowances.map((allowance) =>
                  getChainTokenDataByName(allowance.chainName) ? (
                    <ChainChip
                      key={allowance.chainName}
                      chainToken={
                        getChainTokenDataByName(
                          allowance.chainName
                        ) as ChainToken
                      }
                      withLabel={true}
                    />
                  ) : null
                )}
                {userData?.allowances.length === 0 && (
                  <p className="text-md font-semibold text-nowrap">
                    No allowance, please add allowance first
                  </p>
                )}
              </div>
            </Value>
          </KeyValueDataCard>
          <KeyValueDataCard
            isLoading={isLoadingUserData}
            orientation="horizontal"
            className="flex-1 bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow transition-shadow duration-300"
          >
            <Key>{"Sender"}</Key>
            <Value className="text-lg font-bold text-ellipsis overflow-hidden w-full text-gray-500">
              {walletClient?.account.address}
            </Value>
          </KeyValueDataCard>
          <KeyValueDataCard
            isLoading={isLoadingUserData}
            orientation="horizontal"
            className="bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow transition-shadow duration-300"
          >
            <Key>Send USDC Amount</Key>
            <Value className="text-xl font-bold">
              <input
                required
                type="text"
                inputMode="decimal"
                className="w-full px-0 py-2 bg-transparent border-0 text-2xl font-bold active:border-0 focus:outline-none focus:ring-0 transition-colors"
                placeholder="0.000000"
                value={amount}
                onChange={handleAmountChange}
              />
              <p className="text-sm font-normal text-gray-500">
                Total Balance: {totalBalance} USDC
              </p>
              {!isAmountValid() && (
                <Badge variant="destructive" className="text-sm font-normal">
                  Invalid amount
                </Badge>
              )}
            </Value>
            <Action>
              <Image
                width={24}
                height={24}
                src={"/logo/usdc-logo.png"}
                alt={"USDC"}
                className="rounded-full"
              />
            </Action>
          </KeyValueDataCard>
        </TransferWidgetSection>
        <TransferWidgetIcon />
        <TransferWidgetSection title="Recipient">
          <KeyValueDataCard orientation="horizontal">
            <Key>{"Recipient"}</Key>
            <Value
              className={cn(
                "text-lg font-bold text-ellipsis overflow-hidden w-full"
              )}
            >
              <input
                type="text"
                className="w-full px-0 py-2 bg-transparent border-0 text-lg active:border-0 focus:outline-none focus:ring-0 transition-colors"
                placeholder="Recipient Address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
            </Value>
          </KeyValueDataCard>
          <KeyValueDataCard
            orientation="horizontal"
            isLoading={isLoadingUserData}
          >
            <Key>{"Recipient Target Chain"}</Key>
            <Value
              className={cn(
                "text-lg font-bold text-ellipsis overflow-hidden w-full"
              )}
            >
              <Select
                value={recipientTargetChain}
                onValueChange={setRecipientTargetChain}
              >
                <SelectTrigger className="w-full border-0 shadow-none rounded-none px-0 py-2 focus-visible:ring-0 transition-colors">
                  <SelectValue
                    placeholder="Select a chain"
                    className="w-full"
                  />
                </SelectTrigger>
                <SelectContent>
                  {ChainTokenList.map((chainToken) => (
                    <SelectItem
                      key={chainToken.network}
                      value={chainToken.network}
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={chainToken.image || ""}
                          alt={chainToken.network}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        {chainToken.network}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Value>
          </KeyValueDataCard>
        </TransferWidgetSection>
      </div>
      <Button
        variant="default"
        className="w-full py-6 text-lg rounded-xl duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
        disabled={
          !amount ||
          !recipientAddress ||
          !recipientTargetChain ||
          !isAmountValid()
        }
        onClick={handleOpenConfirmDialog}
      >
        {!recipientAddress
          ? "請輸入收款地址"
          : !recipientTargetChain
          ? "請選擇目標鏈"
          : !amount || parseFloat(amount) <= 0
          ? "請輸入金額"
          : !isAmountValid()
          ? "餘額不足"
          : "確認並簽名"}
      </Button>

      {/* 確認交易對話框 */}
      <ConfirmTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transactionData={transactionSignData}
        onCompleted={handleTransactionCompleted}
      />
    </div>
  );
}

function TransferWidgetSectionHeader({ title }: { title: string }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <h3 className="text-4xl font-thin">{title}</h3>
    </div>
  );
}

function TransferWidgetIcon() {
  return (
    <div className="w-12 h-12 flex items-center justify-center rounded-md p-1">
      <ArrowDown className="w-full h-full text-blue-500" />
    </div>
  );
}

function TransferWidgetSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col gap-2">
      <TransferWidgetSectionHeader title={title} />
      {children}
    </div>
  );
}
