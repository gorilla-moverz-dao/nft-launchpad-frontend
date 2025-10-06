import { useQuery } from "@tanstack/react-query";
import { launchpadClient } from "@/lib/aptos";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";

const query = graphql(`
  query MintingCollections($collection_ids: [String!]!) {
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

type UseMintingCollectionsOptions = {
  enabled?: boolean;
};

export const useMintingCollections = (options?: UseMintingCollectionsOptions) => {
  const { enabled = true } = options ?? {};
  return useQuery({
    queryKey: ["minting-collections"],
    enabled,
    queryFn: async () => {
      const [registry] = await launchpadClient.view.get_registry({
        functionArguments: [],
        typeArguments: [],
      });

      const collectionIds = registry.map((item: any) => item.inner);
      const collections = await executeGraphQL(query, { collection_ids: collectionIds });
      return collections.current_collections_v2;
    },
  });
};
