import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";

const query = graphql(`
  query getNFTs($address: String, $collection_id: String, $limit: Int, $offset: Int) {
    current_token_ownerships_v2(
      where: {
        owner_address: { _eq: $address }
        amount: { _gt: "0" }
        current_token_data: { current_collection: { collection_id: { _eq: $collection_id } } }
      }
      order_by: [{ last_transaction_timestamp: desc }]
      limit: $limit
      offset: $offset
    ) {
      token_data_id
      current_token_data {
        token_name
        description
        token_properties
        token_uri
      }
    }
  }
`);

export const useCollectionNFTs = (collectionId: string) => {
  const { account, connected } = useWallet();

  return useQuery({
    queryKey: ["nfts", account?.address.toString(), collectionId],
    enabled: !!account && connected,
    queryFn: async () => {
      // TODO: Paginate
      const res = await executeGraphQL(query, {
        collection_id: collectionId,
        address: account?.address.toString(),
        limit: 100,
        offset: 0,
      });
      return res;
    },
  });
};
