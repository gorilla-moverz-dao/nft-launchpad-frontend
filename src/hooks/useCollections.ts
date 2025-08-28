import { useQuery } from "@tanstack/react-query";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";

const query = graphql(`
  query Collections($collection_ids: [String!]!) {
    current_collections_v2(where: { collection_id: { _in: $collection_ids } }) {
      creator_address
      collection_id
      collection_name
      current_supply
      max_supply
      uri
      description
    }
  }
`);

export const useCollections = ({ collectionIds, enabled }: { collectionIds: Array<string>; enabled: boolean }) => {
  return useQuery({
    queryKey: ["collections", collectionIds],
    enabled,
    queryFn: async () => {
      const collections = await executeGraphQL(query, { collection_ids: collectionIds });
      return collections.current_collections_v2;
    },
  });
};
