import { useQuery } from "@tanstack/react-query";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";
import { launchpadClient } from "@/lib/aptos";

const query = graphql(`
  query TokenQuery($collection_id: String) {
    current_collections_v2(where: { collection_id: { _eq: $collection_id } }, limit: 1) {
      creator_address
      collection_id
      collection_name
      current_supply
      max_supply
      uri
      description
    }
    current_collection_ownership_v2_view(where: { collection_id: { _eq: $collection_id } }, order_by: { last_transaction_version: desc }) {
      owner_address
    }
    current_collection_ownership_v2_view_aggregate(where: { collection_id: { _eq: $collection_id } }) {
      aggregate {
        count(distinct: true, columns: owner_address)
      }
    }
  }
`);

export type CollectionData = NonNullable<ReturnType<typeof useCollectionData>["data"]>["collection"];

export function useCollectionData(collectionId: `0x${string}`) {
  return useQuery({
    queryKey: ["collections", collectionId],
    refetchInterval: 30 * 1000, // 30 seconds
    queryFn: async () => {
      const res = await executeGraphQL(query, {
        collection_id: collectionId,
      });

      const [premintAmount] = await launchpadClient.view.get_premint_amount({
        typeArguments: [],
        functionArguments: [collectionId],
      });

      return {
        collection: res.current_collections_v2[0],
        owner: res.current_collection_ownership_v2_view[0],
        ownerCount: res.current_collection_ownership_v2_view_aggregate.aggregate?.count ?? 0,
        premint_amount: premintAmount,
      };
    },
  });
}
