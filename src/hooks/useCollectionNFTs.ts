import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { Current_Token_Ownerships_V2_Bool_Exp, Current_Token_Ownerships_V2_Order_By, Order_By } from "@/graphql/graphql";
import type { CollectionSearch } from "./useCollectionSearch";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";

// Interface for trait filter data
export interface TraitFilter {
  trait_type: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

// Interface for trait filters in query parameters
export interface TraitFilters {
  [traitType: string]: Array<string>;
}

interface NFTQueryFilter {
  onlyOwned: boolean;
  collectionIds: Array<string>;
  tokenIds?: Array<string>;
  search?: string;
  traits?: TraitFilters;
}

// Interface for NFT query parameters
export interface NFTQueryParams extends NFTQueryFilter {
  sort?: CollectionSearch["sort"];
  page?: number;
  limit?: number;
}

// Interface for trait aggregation result
export interface TraitAggregationResult {
  traits: Array<TraitFilter>;
  totalNFTs: number;
}

const query = graphql(`
  query getNFTs(
    $where: current_token_ownerships_v2_bool_exp
    $orderBy: [current_token_ownerships_v2_order_by!]
    $limit: Int
    $offset: Int
  ) {
    current_token_ownerships_v2(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
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

// Separate query for trait aggregation
const traitAggregationQuery = graphql(`
  query getTraitAggregation($where: current_token_ownerships_v2_bool_exp) {
    current_token_ownerships_v2(where: $where) {
      current_token_data {
        token_properties
      }
    }
  }
`);

export type NFTData = NonNullable<ReturnType<typeof useCollectionNFTs>["data"]>["current_token_ownerships_v2"][number];

// Helper function to extract and aggregate traits from token properties
// TODO: This is a temporary solution to aggregate traits. We need to aggregate on the server side.
const aggregateTraits = (nfts: Array<any>): Array<TraitFilter> => {
  const traitMap = new Map<string, Map<string, number>>();

  nfts.forEach((nft) => {
    const tokenProperties = nft.current_token_data?.token_properties;
    if (!tokenProperties || typeof tokenProperties !== "object") return;

    Object.entries(tokenProperties).forEach(([traitType, traitValue]) => {
      // Skip non-trait properties (like image, description, etc.)
      if (traitType === "image" || traitType === "description" || traitType === "name") return;

      const value = String(traitValue);

      if (!traitMap.has(traitType)) {
        traitMap.set(traitType, new Map());
      }

      const valueMap = traitMap.get(traitType)!;
      valueMap.set(value, (valueMap.get(value) || 0) + 1);
    });
  });

  // Convert to TraitFilter array
  return Array.from(traitMap.entries())
    .map(([traitType, valueMap]) => ({
      trait_type: traitType,
      values: Array.from(valueMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count), // Sort by count descending
    }))
    .sort((a, b) => a.trait_type.localeCompare(b.trait_type)); // Sort by trait type alphabetically
};

const getOrderBy = (sort: CollectionSearch["sort"]): Array<Current_Token_Ownerships_V2_Order_By> => {
  switch (sort) {
    case "newest":
      return [{ last_transaction_timestamp: "desc" as Order_By }];
    case "oldest":
      return [{ last_transaction_timestamp: "asc" as Order_By }];
    case "name":
      return [{ current_token_data: { token_name: "asc" as Order_By } }];
    default:
      return [{ last_transaction_timestamp: "desc" as Order_By }];
  }
};

const getWhere = ({ onlyOwned, collectionIds, tokenIds, search, traits }: NFTQueryFilter, address: string | undefined) => {
  const where: Current_Token_Ownerships_V2_Bool_Exp = {
    amount: { _gt: 0 },
    current_token_data: { collection_id: { _in: collectionIds } },
  };

  if (tokenIds && tokenIds.length > 0) {
    where.token_data_id = { _in: tokenIds };
  }

  if (onlyOwned) {
    where.owner_address = { _eq: address };
  }

  if (traits && Object.keys(traits).length > 0) {
    const and = where._and || [];
    for (const [traitType, values] of Object.entries(traits)) {
      const or: Array<Current_Token_Ownerships_V2_Bool_Exp> = [];
      for (const value of values) {
        or.push({ current_token_data: { token_properties: { _contains: { [traitType]: value } } } });
      }
      and.push({ _or: or });
    }
    where._and = and;
  }

  // Add search filter if provided
  if (search) {
    where._or = [
      { current_token_data: { token_name: { _ilike: `%${search}%` } } },
      { current_token_data: { description: { _ilike: `%${search}%` } } },
      { token_data_id: { _ilike: `%${search}%` } },
    ];
  }

  return where;
};

export const useCollectionNFTs = (params: NFTQueryParams) => {
  const { account, connected } = useWallet();

  const orderBy = getOrderBy(params.sort ?? "newest");
  const limit = params.limit ?? 100;
  const page = params.page ?? 1;
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["nfts", account?.address.toString(), params],
    enabled: !params.onlyOwned || (!!account && connected),
    queryFn: async () => {
      const where = getWhere(params, account?.address.toString());

      const res = await executeGraphQL(query, {
        where,
        orderBy,
        limit,
        offset,
      });
      return res;
    },
  });
};

// Separate hook for trait aggregation
export const useTraitAggregation = (params: NFTQueryFilter) => {
  const { account, connected } = useWallet();

  return useQuery({
    queryKey: ["trait-aggregation", account?.address.toString(), params],
    enabled: !params.onlyOwned || (!!account && connected),
    queryFn: async (): Promise<TraitAggregationResult> => {
      const where = getWhere(params, account?.address.toString());
      const res = await executeGraphQL(traitAggregationQuery, { where });

      // Aggregate traits from the fetched NFTs
      const traitData = aggregateTraits(res.current_token_ownerships_v2);

      return {
        traits: traitData,
        totalNFTs: res.current_token_ownerships_v2.length,
      };
    },
  });
};
