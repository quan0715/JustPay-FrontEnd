type User = {
  address: string;
  spenderAddress: string;
  allowances: {
    chainName: string;
    tokenAddress: string;
    amount: string;
    txHash: string;
    spenderAddress: string;
  }[];
};

export default User;
