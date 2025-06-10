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
import { Key, KeyValueDataCard, Value, Action } from "../key-value-data-card";
import { useUserTokenBalance } from "@/hooks/useUserTokenBalance";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUserData";
import { ChainChip, ChainSelectItem } from "../dappComponent/ChainChip";
import { TOKEN_METADATA_MAP, getUSDCMetadata } from "@/models/token";
import { USDCTransferTransactionMetaDataInput } from "@/models/transaction";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { getExpectedProxyDepositForBurnTransactions } from "@/utils/prepareProxyAction";
import { ConfirmTransactionDrawer } from "./ConfirmTransactionDrawer";
import { useSearchParams } from "next/navigation";

export function TransferWidget() {
  const searchParams = useSearchParams();
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [recipientTargetChainId, setRecipientTargetChainId] = useState<number>(
    TOKEN_METADATA_MAP.USDC[0].chainId
  );
  const { userData, isLoadingUserData } = useUser();
  const {
    fetchAllTokenBalances,
    totalBalance,
    balances,
    isLoading: isBalanceLoading,
  } = useUserTokenBalance();

  // 確認對話框狀態
  // const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [transactionMetaDataInput, setTransactionMetaDataInput] =
    useState<USDCTransferTransactionMetaDataInput | null>(null);
  const resetFormState = () => {
    setTransactionMetaDataInput(null);
    setRecipientAddress("");
    setAmount("");
    setRecipientTargetChainId(TOKEN_METADATA_MAP.USDC[0].chainId);
  };
  // 打開確認對話框
  const onSubmit = () => {
    if (!userData?.allowances) {
      toast.error("請先添加允許網絡");
      return;
    }
    if (
      !amount ||
      parseFloat(amount) <= 0 ||
      !recipientAddress ||
      !recipientTargetChainId
    ) {
      toast.error("請填寫完整轉賬資訊");
      return;
    }

    // 獲取目標鏈的資訊
    const destinationChain = getUSDCMetadata(recipientTargetChainId);
    if (!destinationChain) {
      toast.error("目標鏈資訊無效");
      return;
    }
    // 設置交易數據
    const sourceChainIds = userData?.allowances.map(
      (allowance) => allowance.chainId
    );
    if (!sourceChainIds) {
      toast.error("請先添加允許網絡");
      return;
    }
    const expectedProxyDepositForBurnTransactions =
      getExpectedProxyDepositForBurnTransactions({
        totalAmount: amount,
        balances: balances,
        totalBalance: totalBalance,
        sourceChainIds: sourceChainIds,
      });
    if (
      expectedProxyDepositForBurnTransactions.status === "error" ||
      !expectedProxyDepositForBurnTransactions.result
    ) {
      toast.error(expectedProxyDepositForBurnTransactions.message);
      return;
    }
    const _transactionMetaDataInput = {
      senderAddress: userData?.address || "",
      recipientAddress,
      expectedProxyDepositForBurnTransactions:
        expectedProxyDepositForBurnTransactions.result,
      destinationChainId: recipientTargetChainId,
    };

    setTransactionMetaDataInput(_transactionMetaDataInput);
    setDialogOpen(true);
    console.log(_transactionMetaDataInput);
  };

  const isAmountValid = () => {
    if (parseFloat(amount) > parseFloat(totalBalance)) {
      return false;
    }
    return true;
  };

  const isSubmitDisabled = () => {
    return (
      !amount ||
      !recipientAddress ||
      !recipientTargetChainId ||
      !isAmountValid()
    );
  };

  // 處理 URL 參數
  useEffect(() => {
    const toAddress = searchParams.get("to");
    const urlAmount = searchParams.get("amount");
    const chainId = searchParams.get("chainId");

    if (toAddress) {
      setRecipientAddress(toAddress);
    }

    if (urlAmount) {
      setAmount(urlAmount);
    }

    if (chainId) {
      const chainIdNum = parseInt(chainId);
      // 確保 chainId 在支援的鏈列表中
      const supportedChainIds = TOKEN_METADATA_MAP.USDC.map(
        (token) => token.chainId
      );
      if (supportedChainIds.includes(chainIdNum)) {
        setRecipientTargetChainId(chainIdNum);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAllTokenBalances(
      userData?.address || "",
      userData?.allowances.map((allowance) => allowance.chainId) || []
    );
  }, []);

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
                {userData?.allowances.map((allowance) => (
                  <ChainChip
                    key={allowance.chainId}
                    label={allowance.chainName}
                    tokenImage={getUSDCMetadata(allowance.chainId)?.tokenImage}
                  />
                ))}
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
          >
            <Key>{"Sender"}</Key>
            <Value className="text-lg font-bold text-ellipsis overflow-hidden w-full text-gray-500">
              {userData?.address}
            </Value>
          </KeyValueDataCard>
          <KeyValueDataCard
            isLoading={isLoadingUserData}
            orientation="horizontal"
          >
            <Key>Send USDC Amount</Key>
            <Value className="text-xl font-bold">
              <TransferNumberInputComponent
                value={amount}
                onChange={setAmount}
                disabled={isBalanceLoading}
              />
              {isBalanceLoading ? (
                <div className="flex flex-row gap-2 items-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm font-normal text-gray-500">
                    Loading...
                  </p>
                </div>
              ) : (
                <p className="text-sm font-normal text-gray-500">
                  Total Balance: {parseFloat(totalBalance).toFixed(2)} USDC
                </p>
              )}
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
            <Value>
              <TransferTextInputComponent
                value={recipientAddress}
                onChange={(value) => setRecipientAddress(value)}
                placeholder="Recipient Address"
                disabled={false}
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
                value={recipientTargetChainId.toString()}
                onValueChange={(value) =>
                  setRecipientTargetChainId(Number(value))
                }
              >
                <SelectTrigger className="w-full border-0 shadow-none rounded-none px-0 py-2 focus-visible:ring-0 transition-colors">
                  <SelectValue
                    placeholder="Select a chain"
                    className="w-full"
                  />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_METADATA_MAP.USDC.map((chainToken) => (
                    <SelectItem
                      key={chainToken.chainId}
                      value={chainToken.chainId.toString()}
                    >
                      <ChainSelectItem
                        label={chainToken.chainName}
                        tokenImage={chainToken.tokenImage}
                      />
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
        disabled={isSubmitDisabled()}
        onClick={onSubmit}
      >
        {!recipientAddress
          ? "Please enter the recipient address"
          : !recipientTargetChainId
          ? "Please select the target chain"
          : !amount || parseFloat(amount) <= 0
          ? "Please enter the amount"
          : !isAmountValid()
          ? "Insufficient balance"
          : "Confirm and sign"}
      </Button>

      {transactionMetaDataInput && (
        <ConfirmTransactionDrawer
          open={dialogOpen}
          setOpen={setDialogOpen}
          transactionData={transactionMetaDataInput}
          onActionSuccess={resetFormState}
        />
      )}
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

function TransferTextInputComponent({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      disabled={disabled}
      className="w-full px-0 py-2 bg-transparent border-0 text-lg active:border-0 focus:outline-none focus:ring-0 transition-colors"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function TransferNumberInputComponent({
  value,
  onChange,
  placeholder = "0.00",
  disabled = false,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      required
      type="text"
      inputMode="decimal"
      className="w-full px-0 py-2 bg-transparent border-0 text-2xl font-bold active:border-0 focus:outline-none focus:ring-0 transition-colors"
      placeholder={placeholder}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
