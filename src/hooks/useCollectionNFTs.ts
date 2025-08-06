import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { Current_Token_Ownerships_V2_Bool_Exp, Current_Token_Ownerships_V2_Order_By, Order_By } from "@/graphql/graphql";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";

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

type SortOption = "newest" | "oldest" | "name" | "rarity";

// Type for trait filter data
export interface TraitFilter {
  trait_type: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

// Helper function to extract and aggregate traits from token properties
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

const getOrderBy = (sort: SortOption): Array<Current_Token_Ownerships_V2_Order_By> => {
  switch (sort) {
    case "newest":
      return [{ last_transaction_timestamp: "desc" as Order_By }];
    case "oldest":
      return [{ last_transaction_timestamp: "asc" as Order_By }];
    case "name":
      return [{ current_token_data: { token_name: "asc" as Order_By } }];
    case "rarity":
      // For rarity, we'll sort by token_data_id as a fallback since rarity calculation is complex
      return [{ token_data_id: "asc" as Order_By }];
    default:
      return [{ last_transaction_timestamp: "desc" as Order_By }];
  }
};

const getWhere = (
  onlyOwned: boolean,
  address: string | undefined,
  collectionIds: Array<string>,
  tokenIds?: Array<string>,
  search?: string,
  traits?: Record<string, Array<string>>,
) => {
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

export const useCollectionNFTs = (
  onlyOwned: boolean,
  collectionIds: Array<string>,
  sort: SortOption = "newest",
  search?: string,
  page: number = 1,
  limit: number = 20,
  tokenIds?: Array<string>,
  traits?: Record<string, Array<string>>,
) => {
  const { account, connected } = useWallet();

  const orderBy = getOrderBy(sort);

  return useQuery({
    queryKey: ["nfts", account?.address.toString(), collectionIds, tokenIds, onlyOwned, sort, search, page, limit, orderBy, traits],
    enabled: !onlyOwned || (!!account && connected),
    queryFn: async () => {
      const where = getWhere(onlyOwned, account?.address.toString(), collectionIds, tokenIds, search, traits);

      const res = await executeGraphQL(query, {
        where,
        orderBy,
        limit,
        offset: (page - 1) * limit,
      });
      return res;
    },
  });
};

// Separate hook for trait aggregation
export const useTraitAggregation = (
  onlyOwned: boolean,
  collectionIds: Array<string>,
  tokenIds?: Array<string>,
  traits?: Record<string, Array<string>>,
) => {
  const { account, connected } = useWallet();

  return useQuery({
    queryKey: ["trait-aggregation", account?.address.toString(), collectionIds, tokenIds, onlyOwned, traits],
    enabled: !onlyOwned || (!!account && connected),
    queryFn: async () => {
      const where = getWhere(onlyOwned, account?.address.toString(), collectionIds, tokenIds, undefined, traits);
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
