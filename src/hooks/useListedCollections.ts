import { useQuery } from "@tanstack/react-query";
import { launchpadClient } from "@/lib/aptos";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";

const query = graphql(`
  query ListedCollections($collection_ids: [String!]!) {
    current_collections_v2(where: { collection_id: { _in: $collection_ids } }) {
      collection_id
      collection_name
      current_supply
      max_supply
      uri
      description
    }
  }
`);

export const useListedCollections = () => {
  return useQuery({
    queryKey: ["listed-collections"],
    queryFn: async () => {
      const [registry] = await launchpadClient.view.get_listed_collections({
        functionArguments: [],
        typeArguments: [],
      });

      const collectionIds = registry.map((item) => item.inner);
      const collections = await executeGraphQL(query, { collection_ids: collectionIds });
      return collections.current_collections_v2;
    },
  });
};
