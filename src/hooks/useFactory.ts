import { useAuth } from "./useAuth";
import { ethers } from "ethers";
export const useFactoryContract = () => {
  const { address, isAuthenticated } = useAuth();

  const getSpenderAddress = async (
    salt: number = 0,
    operatorAddress: string = "0xBDAff86a8B9dD8E5dcb742C6CB8f9977E960A03B"
  ) => {
    if (!isAuthenticated) return;
    console.log("salt", salt);
    console.log("address", address);
    console.log("operatorAddress", operatorAddress);
    const factorABI = [
      "function computeAddress(uint256 _salt_int, address signer, address operator) public view returns (address)",
    ];
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const factoryContract = new ethers.Contract(
      "0x28d8501cFFA0C88D35A79a728428e8d82C748Bb0",
      factorABI,
      signer
    );
    const spenderAddress = await factoryContract.computeAddress(
      salt,
      address,
      operatorAddress
    );
    return spenderAddress;
  };
  return { getSpenderAddress };
};
