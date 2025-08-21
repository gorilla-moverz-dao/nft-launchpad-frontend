import { STAKING_CONTRACT_ADDRESS } from "@/constants";
import type { Collection } from "@/fragments/collection";
import { aptos } from "@/lib/aptos";
import { useQuery } from "@tanstack/react-query";

export const useCollectionStakingStatus = (creatorAddress: string, collectionName: string) => {
  return useQuery({
    queryKey: ["staking-status", creatorAddress, collectionName],
    queryFn: async () => {
      try {
        const payload = {
          payload: {
            function: `${STAKING_CONTRACT_ADDRESS}::tokenstaking::is_staking_enabled` as const,
            typeArguments: [],
            functionArguments: [creatorAddress, collectionName],
          }
        };
        
        const result = await aptos.view(payload);
        return result[0] as boolean;
      } catch (error) {
        console.error("Error checking staking status:", error);
        return false;
      }
    },
    enabled: !!creatorAddress && !!collectionName,
  });
};

export const useAllCollectionStakingStatuses = (collections: Collection[]) => {
  return useQuery({
    queryKey: ["all-staking-statuses", collections.map(c => c.collection_id)],
    queryFn: async () => {
      const statuses: Record<string, boolean> = {};
      
      for (const collection of collections) {
        if (collection.creator_address && collection.collection_name) {
          try {
            const payload = {
              payload: {
                function: `${STAKING_CONTRACT_ADDRESS}::tokenstaking::is_staking_enabled` as const,
                typeArguments: [],
                functionArguments: [collection.creator_address, collection.collection_name],
              }
            };
            
            const result = await aptos.view(payload);
            statuses[collection.collection_id] = result[0] as boolean;
          } catch (error) {
            console.error(`Error checking staking status for ${collection.collection_name}:`, error);
            statuses[collection.collection_id] = false;
          }
        }
      }
      
      return statuses;
    },
    enabled: collections.length > 0,
  });
};

export const useStakingInfo = (_creatorAddress: string, _collectionName: string) => {
  return useQuery({
    queryKey: ["staking-info", _creatorAddress, _collectionName],
    queryFn: async () => {
      await Promise.resolve();
      return null;
    },
  });
};

export const useUserStakedNFTs = (_userAddress: string) => {
  return useQuery({
    queryKey: ["user-staked-nfts", _userAddress],
    queryFn: async () => {
      await Promise.resolve();
      return [];
    },
  });
};

export const useUserStakingRewards = (_userAddress: string, _collectionName: string, _tokenName: string, _creatorAddress: string) => {
  return useQuery({
    queryKey: ["user-staking-rewards", _userAddress, _collectionName, _tokenName, _creatorAddress],
    queryFn: async () => {
      await Promise.resolve();
      return null;
    },
  });
}; 