type User = {
  address: string;
  allowances: {
    chainName: string;
    tokenAddress: string;
    amount: string;
    txHash: string;
  }[];
};

export default User;
