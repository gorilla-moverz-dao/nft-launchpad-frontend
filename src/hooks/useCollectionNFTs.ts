import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";

const query = graphql(`
  query getNFTs($address: String, $collection_ids: [String!], $limit: Int, $offset: Int, $token_ids: [String!]) {
    current_token_ownerships_v2(
      where: {
        owner_address: { _eq: $address }
        amount: { _gt: "0" }
        current_token_data: { current_collection: { collection_id: { _in: $collection_ids } } }
        token_data_id: { _in: $token_ids }
      }
      order_by: [{ last_transaction_timestamp: desc }]
      limit: $limit
      offset: $offset
    ) {
      token_data_id
      current_token_data {
        collection_id
        token_name
        description
        token_properties
        token_uri
      }
    }
  }
`);

const queryAll = graphql(`
  query getAllNFTs($address: String, $collection_ids: [String!], $limit: Int, $offset: Int) {
    current_token_ownerships_v2(
      where: {
        owner_address: { _eq: $address }
        amount: { _gt: "0" }
        current_token_data: { current_collection: { collection_id: { _in: $collection_ids } } }
      }
      order_by: [{ last_transaction_timestamp: desc }]
      limit: $limit
      offset: $offset
    ) {
      token_data_id
      current_token_data {
        collection_id
        token_name
        description
        token_properties
        token_uri
      }
    }
  }
`);

export const useCollectionNFTs = (collectionIds: Array<string>, tokenIds?: Array<string>) => {
  const { account, connected } = useWallet();

  return useQuery({
    queryKey: ["nfts", account?.address.toString(), collectionIds, tokenIds],
    enabled: !!account && connected,
    queryFn: async () => {
      // TODO: Paginate
      if (tokenIds && tokenIds.length > 0) {
        // Use filtered query when tokenIds are provided
        const res = await executeGraphQL(query, {
          collection_ids: collectionIds,
          address: account?.address.toString(),
          limit: 100,
          offset: 0,
          token_ids: tokenIds,
        });
        return res;
      } else {
        // Use unfiltered query when no tokenIds are provided
        const res = await executeGraphQL(queryAll, {
          collection_ids: collectionIds,
          address: account?.address.toString(),
          limit: 100,
          offset: 0,
        });
        return res;
      }
    },
  });
};
