// hooks/useApproveERC20WithEthers.ts
import { ethers } from "ethers";
import {
  useContractWrite,
  useContractRead,
  useContractWriteWithOperator,
} from "./useContractInteraction";

const erc20Abi = [
  "function approve(address spender, uint256 amount) returns (bool)",
];

const computeAddressAbi = [
  "function computeAddress(uint256 _salt_int, address signer, address operator) public view returns (address)",
];

const deployCreate2Abi = [
  "function deploy(uint256 _salt_int, address signer, address operator) returns (address)",
];
const FactoryAddress = "0xdce81c84C153e25C20f58031cEaD6edaB8318813";
// const FactoryAddress = "0x28d8501cFFA0C88D35A79a728428e8d82C748Bb0";
const OperatorAddress = "0xBDAff86a8B9dD8E5dcb742C6CB8f9977E960A03B";
export function useEnableNetwork() {
  const { status: approveStatus, writeContract: _approveERC20 } =
    useContractWrite();
  const { status: getSpenderAddressStatus, readContract: _getSpenderAddress } =
    useContractRead();

  const {
    status: deployCreate2Status,
    writeContractWithOperator: _deployCreate2,
  } = useContractWriteWithOperator();

  async function getSpenderAddress({
    userAddress,
    contractAddress = FactoryAddress,
    operatorAddress = OperatorAddress,
    chainId,
    salt = 0,
  }: {
    salt?: number;
    userAddress: string;
    contractAddress?: string;
    operatorAddress?: string;
    chainId: number;
  }) {
    console.log("getSpenderAddress", salt);
    const spenderAddress = await _getSpenderAddress(
      {
        contractAddress,
        contractAbi: computeAddressAbi,
        chainId,
      },
      "computeAddress",
      [salt, userAddress as `0x${string}`, operatorAddress]
    );
    console.log("spenderAddress", spenderAddress);
    return spenderAddress;
  }

  async function approveERC20({
    tokenAddress,
    spenderAddress,
    amount,
    chainId,
    useMax = true,
  }: {
    tokenAddress: string;
    spenderAddress: string;
    amount?: string;
    chainId: number;
    useMax?: boolean;
  }) {
    await _approveERC20(
      {
        contractAddress: tokenAddress,
        contractAbi: erc20Abi,
        chainId,
      },
      "approve",
      [
        spenderAddress,
        useMax ? ethers.MaxUint256 : ethers.parseUnits(amount ?? "0", 6),
      ]
    );
  }

  async function deployCreate2({
    userAddress,
    chainId,
    salt = 0,
  }: {
    userAddress: string;
    chainId: number;
    salt?: number;
  }) {
    const tx = await _deployCreate2(
      {
        contractAddress: FactoryAddress,
        contractAbi: deployCreate2Abi,
        chainId,
      },
      "deploy",
      [salt, userAddress as `0x${string}`, OperatorAddress]
    );
    return tx;
  }

  return {
    getSpenderAddress,
    approveERC20,
    deployCreate2,
    approveStatus,
    getSpenderAddressStatus,
    deployCreate2Status,
  };
}
