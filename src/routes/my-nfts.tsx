import { createFileRoute } from "@tanstack/react-router";
import { COLLECTION_ID } from "@/constants";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";

export const Route = createFileRoute("/my-nfts")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading, error } = useCollectionNFTs(COLLECTION_ID);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>My NFTs</h1>
      <div>{data?.current_token_ownerships_v2.map((nft) => <div key={nft.token_data_id}>{nft.current_token_data?.token_name}</div>)}</div>
    </div>
  );
}
