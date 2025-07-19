import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import { APTOS_FAUCET_URL, APTOS_INDEXER_URL, APTOS_RPC_URL } from "@/constants";
import { ABI as launchpadABI } from "@/abi/nft_launchpad";

// Network configuration
const config = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: APTOS_RPC_URL,
  indexer: APTOS_INDEXER_URL,
  faucet: APTOS_FAUCET_URL,
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
