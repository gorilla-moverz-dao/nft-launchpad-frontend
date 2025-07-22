import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import { MOVE_NETWORK } from "@/constants";
import { ABI as launchpadABI } from "@/abi/nft_launchpad";

// Network configuration
const config = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: MOVE_NETWORK.rpcUrl,
  indexer: MOVE_NETWORK.indexerUrl,
  faucet: MOVE_NETWORK.faucetUrl,
});

// Initialize client
export const aptos = new Aptos(config);
export const launchpadClient = createSurfClient(aptos).useABI(launchpadABI);

// Helper function to get account balance
export const getAccountBalance = async (address: string) => {
  const resources = await aptos.getAccountAPTAmount({
    accountAddress: address,
  });
  return resources ? BigInt(resources.toString()) : BigInt(0);
};
