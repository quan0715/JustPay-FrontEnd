type User = {
  address: string;
  spenderAddress: string;
  salt: number;
  allowances: {
    chainName: string;
    chainId: number;
    tokenAddress: string;
    amount: string;
    txHash: string;
    spenderAddress: string;
  }[];
};

export default User;
