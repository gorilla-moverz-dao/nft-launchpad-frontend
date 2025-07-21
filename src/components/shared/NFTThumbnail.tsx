import { toShortAddress } from "@/lib/utils";

interface NFTThumbnailProps {
  nft: any;
  collectionData?: any;
  onClick?: () => void;
  className?: string;
}

export function NFTThumbnail({ nft, collectionData, onClick, className = "" }: NFTThumbnailProps) {
  return (
    <div
      className={`border rounded-lg p-4 space-y-2 cursor-pointer hover:border-primary/50 hover:shadow-md hover:bg-muted/30 transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
        {nft.current_token_data?.token_uri ? (
          <img
            src={nft.current_token_data.token_uri}
            alt={nft.current_token_data.token_name || "NFT"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = collectionData?.collection.uri || "";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="font-semibold truncate">{nft.current_token_data?.token_name || `Token ${nft.token_data_id}`}</h4>
        {nft.current_token_data?.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{nft.current_token_data.description}</p>
        )}
        <p className="text-xs text-muted-foreground">Token ID: {toShortAddress(nft.token_data_id)}</p>
      </div>
    </div>
  );
}
