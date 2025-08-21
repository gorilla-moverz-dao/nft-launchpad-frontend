import { STAKING_CONTRACT_ADDRESS } from "@/constants";
import { aptos } from "@/lib/aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useWalletClient } from "@thalalabs/surf/hooks";

// movement_staking::tokenstaking module and function names
const STAKING_MODULE = "tokenstaking";
const FUNCTIONS = {
  CREATE_STAKING: "create_staking",
  STAKE_TOKEN: "stake_token",
  UNSTAKE_TOKEN: "unstake_token",
  CLAIM_REWARD: "claim_reward",
  UPDATE_DPR: "update_dpr",
  CREATOR_STOP_STAKING: "creator_stop_staking",
  DEPOSIT_STAKING_REWARDS: "deposit_staking_re" as unknown as string,
} as const;

// Staking service class
export class StakingService {
  constructor(
    private signAndSubmitTransaction: ((txn: any) => Promise<any>) | null,
    private senderAddress: string | undefined,
  ) {}

  // Stake an NFT: stake_token(staker, nft: Object<Token>)
  async stakeNFT(nftObjectAddress: string) {
    if (!this.signAndSubmitTransaction || !this.senderAddress) throw new Error("Wallet not ready");
    const payload = {
      sender: this.senderAddress,
      data: {
        function: `${STAKING_CONTRACT_ADDRESS}::${STAKING_MODULE}::${FUNCTIONS.STAKE_TOKEN}`,
        typeArguments: [] as string[],
        functionArguments: [nftObjectAddress],
      },
    };
    const res = await this.signAndSubmitTransaction(payload);
    return { success: true, txHash: res?.hash ?? res };
  }

  // Unstake an NFT: unstake_token(staker, creator, collection_name, token_name)
  async unstakeNFT(creatorAddress: string, collectionName: string, tokenName: string) {
    if (!this.signAndSubmitTransaction || !this.senderAddress) throw new Error("Wallet not ready");
    const payload = {
      sender: this.senderAddress,
      data: {
        function: `${STAKING_CONTRACT_ADDRESS}::${STAKING_MODULE}::${FUNCTIONS.UNSTAKE_TOKEN}`,
        typeArguments: [] as string[],
        functionArguments: [creatorAddress, collectionName, tokenName],
      },
    };
    const res = await this.signAndSubmitTransaction(payload);
    return { success: true, txHash: res?.hash ?? res };
  }

  // Claim rewards: claim_reward(staker, collection_name, token_name, creator)
  async claimRewards(collectionName: string, tokenName: string, creatorAddress: string) {
    if (!this.signAndSubmitTransaction || !this.senderAddress) throw new Error("Wallet not ready");
    const payload = {
      sender: this.senderAddress,
      data: {
        function: `${STAKING_CONTRACT_ADDRESS}::${STAKING_MODULE}::${FUNCTIONS.CLAIM_REWARD}`,
        typeArguments: [] as string[],
        functionArguments: [collectionName, tokenName, creatorAddress],
      },
    };
    const res = await this.signAndSubmitTransaction(payload);
    return { success: true, txHash: res?.hash ?? res };
  }

  // (Placeholders for info APIs)
  async checkCollectionStakingStatus(creatorAddress: string, collectionName: string): Promise<boolean> {
    try {
      // Call the view function is_staking_enabled
      const payload = {
        payload: {
          function: `${STAKING_CONTRACT_ADDRESS}::tokenstaking::is_staking_enabled` as const,
          typeArguments: [],
          functionArguments: [creatorAddress, collectionName],
        }
      };
      
      // Use the aptos client to call the view function
      const result = await aptos.view(payload);
      return result[0] as boolean;
    } catch (error) {
      console.error("Error checking staking status:", error);
      return false;
    }
  }

  async getCollectionStakingInfo(_creatorAddress: string, _collectionName: string) {
    try {
      await Promise.resolve();
      return null;
    } catch (error) {
      console.error("Error fetching staking info:", error);
      return null;
    }
  }

  async getUserStakedNFTs(_userAddress: string) {
    try {
      await Promise.resolve();
      return [];
    } catch (error) {
      console.error("Error fetching staked NFTs:", error);
      return [];
    }
  }

  async getUserStakingRewards(_userAddress: string, _collectionName: string, _tokenName: string, _creatorAddress: string) {
    try {
      await Promise.resolve();
      return null;
    } catch (error) {
      console.error("Error fetching staking rewards:", error);
      return null;
    }
  }
}

// Hook to use the staking service
export const useStakingService = () => {
  const { signAndSubmitTransaction, account } = useWallet();
  useWalletClient(); // init Surf client if needed elsewhere
  return new StakingService(signAndSubmitTransaction ?? null, account?.address?.toString());
}; 