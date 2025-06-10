// import { BaseContractParams } from "@/models/contract";
import { WriteContractWithOperator } from "./contractAction";
const aaveV3Address = "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27";
const contractAbi = [
  {
    name: "depositToAAVE",
    type: "function",
    inputs: [
      { name: "aaveV3", type: "address" },
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
];
export async function depositToAAVE(
  asset: string,
  amount: string,
  chainId: number
) {
  const txHash = await WriteContractWithOperator(
    {
      contractAddress: "0x82a992E6bdC61fC671A3Dd04a1FcEcBaEfb5d833",
      contractAbi: contractAbi,
      chainId: chainId,
    },
    "depositToAAVE",
    [aaveV3Address, asset, amount]
  );
  return txHash;
}
