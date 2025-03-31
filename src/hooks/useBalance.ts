// Imports the Alchemy SDK
import { Alchemy, Network } from "alchemy-sdk";
import { useState, useEffect } from "react";
// Configures the Alchemy SDK
const config = {
  apiKey: "Bjo3vLhO6Dtl20x0Ss73yDY25x0eY_9G", // Replace with your API key
  network: Network.ETH_SEPOLIA, // Replace with your network
};

// Creates an Alchemy object instance with the config to use for making requests
const alchemy = new Alchemy(config);

export const getBalance = async () => {
  //Initialize variables for the parameters
  const vitalikAddress = "0x55F574536032599068C2Ce9E73f18d244345E262";
  const usdcContract = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  //Call the method to return the token balances for this address
  const response = await alchemy.core.getTokenBalances(vitalikAddress, [
    usdcContract,
  ]);

  //Logging the response to the console
  console.log(response);
  return response;
};

export function useBalance() {
  const [isLoading, setIsLoading] = useState(false);
  const [usdcBalance, setUSDCBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      setIsLoading(true);
      const response = await getBalance();
      console.log(response);
    };
    fetchBalance();
  }, []);

  return { usdcBalance, isLoading };
}
