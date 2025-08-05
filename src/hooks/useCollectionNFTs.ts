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

type SortOption = "newest" | "oldest" | "name" | "rarity";

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

export const useCollectionNFTs = (
  onlyOwned: boolean,
  collectionIds: Array<string>,
  sort: SortOption = "newest",
  search?: string,
  page: number = 1,
  limit: number = 20,
  tokenIds?: Array<string>,
) => {
  const { account, connected } = useWallet();

  const orderBy = getOrderBy(sort);

  return useQuery({
    queryKey: ["nfts", account?.address.toString(), collectionIds, tokenIds, onlyOwned, sort, search, page, limit, orderBy],
    enabled: !onlyOwned || (!!account && connected),
    queryFn: async () => {
      const where: Current_Token_Ownerships_V2_Bool_Exp = {
        amount: { _gt: 0 },
        current_token_data: { collection_id: { _in: collectionIds } },
      };

      if (tokenIds && tokenIds.length > 0) {
        where.token_data_id = { _in: tokenIds };
      }

      if (onlyOwned && connected) {
        where.owner_address = { _eq: account?.address.toString() };
      }

      // Add search filter if provided
      if (search) {
        where._or = [
          { current_token_data: { token_name: { _ilike: `%${search}%` } } },
          { current_token_data: { description: { _ilike: `%${search}%` } } },
          { token_data_id: { _ilike: `%${search}%` } },
        ];
      }

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
