import { GOLDEN_BANANA_CREATOR, MOVE_NETWORK, SILVER_BANANA_CREATOR } from "@/constants";

export async function resolveTokenObjectAddressByGraphQL(tokenName: string, creator: string): Promise<string | null> {
  const query = `
    query GetTokenByCreatorAndName($creator: String!, $tokenName: String!) {
      current_token_datas_v2(
        where: {
          current_collection: { creator_address: { _eq: $creator } }
          token_name: { _eq: $tokenName }
        }
        limit: 1
      ) {
        token_name
        token_data_id
        current_collection { collection_name collection_id creator_address }
      }
    }
  `;
  const res = await fetch(MOVE_NETWORK.indexerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { creator, tokenName } }),
  });
  const json = await res.json();
  const first = json?.data?.current_token_datas_v2?.[0];
  return first?.token_data_id ?? null;
}

// Dynamic resolver that determines the creator address based on collection name
export async function resolveObjectForCollection(tokenName: string, collectionName: string): Promise<string | null> {
  let creator: string;
  
  if (collectionName.toLowerCase().includes("silver banana")) {
    creator = SILVER_BANANA_CREATOR;
  } else if (collectionName.toLowerCase().includes("golden banana")) {
    creator = GOLDEN_BANANA_CREATOR;
  } else {
    // Default to Silver Banana creator for now, but you can extend this logic
    creator = SILVER_BANANA_CREATOR;
  }
  
  return resolveTokenObjectAddressByGraphQL(tokenName, creator);
}

// Convenience helper with your fixed creator address (keeping for backward compatibility)
export async function resolveObjectForSilverBanana(tokenName: string) {
  return resolveTokenObjectAddressByGraphQL(tokenName, SILVER_BANANA_CREATOR);
} 