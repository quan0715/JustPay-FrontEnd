import { useUSDC } from "@/hooks/useUSDC";
import { Network } from "alchemy-sdk";
import { KeyValueDataCard, Key, Value } from "./key-value-data-card";
type BalanceDataCardProps = {
  walletAddress: string;
  network: Network;
  tokenContractAddress: string;
  tokenDecimals: number;
  tokenName: string;
};

export function BalanceDataCard({
  walletAddress,
  network,
  tokenContractAddress,
  tokenDecimals,
  tokenName,
}: BalanceDataCardProps) {
  const { balance, loading, error } = useUSDC({
    walletAddress,
    network,
    tokenContractAddress,
    tokenDecimals,
  });
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <KeyValueDataCard orientation="horizontal" isLoading={loading}>
      <Key>{network}</Key>
      <Value>
        {balance} {tokenName}{" "}
      </Value>
    </KeyValueDataCard>
  );
}
