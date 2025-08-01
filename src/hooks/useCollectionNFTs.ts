import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { Current_Token_Ownerships_V2_Bool_Exp } from "@/graphql/graphql";
import { graphql } from "@/graphql/gql";
import { executeGraphQL } from "@/graphql/executeGraphQL";

const query = graphql(`
  query getNFTs($where: current_token_ownerships_v2_bool_exp, $limit: Int, $offset: Int) {
    current_token_ownerships_v2(where: $where, order_by: [{ last_transaction_timestamp: desc }], limit: $limit, offset: $offset) {
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

export const useCollectionNFTs = (onlyOwned: boolean, collectionIds: Array<string>, tokenIds?: Array<string>) => {
  const { account, connected } = useWallet();

  return useQuery({
    queryKey: ["nfts", account?.address.toString(), collectionIds, tokenIds, onlyOwned],
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

      const res = await executeGraphQL(query, {
        where,
        limit: 100,
        offset: 0,
      });
      return res;
    },
  });
};
