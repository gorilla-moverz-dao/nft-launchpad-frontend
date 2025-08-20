export const NETWORKS = {
  TESTNET: {
    name: "Movement Testnet",
    chainId: 250,
    rpcUrl: "https://full.testnet.movementinfra.xyz/v1",
    indexerUrl: "https://indexer.testnet.movementnetwork.xyz/v1/graphql",
    faucetUrl: "https://faucet.testnet.bardock.movementnetwork.xyz",
    explorerUrl: "https://explorer.movementnetwork.xyz/{0}?network=bardock+testnet",
  },
  MAINNET: {
    name: "Mainnet",
    chainId: 126,
    rpcUrl: "https://full.mainnet.movementinfra.xyz/v1",
    indexerUrl: "https://indexer.mainnet.movementnetwork.xyz/v1/graphql",
    faucetUrl: undefined,
    explorerUrl: "https://explorer.movementnetwork.xyz/{0}?network=mainnet",
  },
};
