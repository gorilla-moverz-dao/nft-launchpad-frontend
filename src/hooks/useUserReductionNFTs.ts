import { useQuery } from "@tanstack/react-query";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";
import { nftReductionManagerClient } from "@/lib/aptos";

const getUserReductionNFTsQuery = graphql(`
  query getUserReductionNFTs($owner_address: String!, $collection_addresses: [String!]!) {
    current_token_ownerships_v2(
      where: { owner_address: { _eq: $owner_address }, current_token_data: { collection_id: { _in: $collection_addresses } } }
      order_by: [{ last_transaction_timestamp: desc }]
    ) {
      token_data_id
      owner_address
      amount
      token_properties_mutated_v1
      current_token_data {
        collection_id
        token_name
        description
        token_uri
      }
    }
  }
`);

export const useUserReductionNFTs = (ownerAddress: string) => {
  return useQuery({
    queryKey: ["user-reduction-nfts", ownerAddress],
    queryFn: async () => {
      // First, get all collection addresses that provide protocol fee reductions
      const [reductionCollections] = await nftReductionManagerClient.view.get_all_collection_protocol_fee_reductions({
        functionArguments: [],
        typeArguments: [],
      });

      console.log("reductionCollections", reductionCollections);
      // Convert the result to string array
      const collectionAddresses = (reductionCollections as Array<string>).map((addr) => addr);

      if (collectionAddresses.length === 0) {
        return [];
      }

      // Then fetch user's NFTs from those collections
      const result = await executeGraphQL(getUserReductionNFTsQuery, {
        owner_address: ownerAddress,
        collection_addresses: collectionAddresses,
      });

      const allNFTs = result.current_token_ownerships_v2;

      // Group NFTs by collection and return only one per collection
      const nftsByCollection = new Map<string, (typeof allNFTs)[0]>();

      allNFTs.forEach((nft) => {
        const collectionId = nft.current_token_data?.collection_id;
        // Only keep the first NFT found for each collection (they're already ordered by last_transaction_timestamp desc)
        if (collectionId && !nftsByCollection.has(collectionId)) {
          nftsByCollection.set(collectionId, nft);
        }
      });

      return Array.from(nftsByCollection.values());
    },
    enabled: !!ownerAddress,
  });
};
