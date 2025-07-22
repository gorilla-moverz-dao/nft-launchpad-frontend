import { useState } from "react";
import { toast } from "sonner";
import type { MintStageInfo } from "@/hooks/useMintStages";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/shared/GlassCard";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { oaptToApt } from "@/lib/utils";
import { WalletSelector } from "@/components/WalletSelector";
import { aptos } from "@/lib/aptos";
import { useClients } from "@/hooks/useClients";
import { useMintBalance } from "@/hooks/useMintBalance";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";
import { useGetAccountNativeBalance } from "@/hooks/useGetAccountNativeBalance";

interface MintStageCardProps {
  stage: MintStageInfo;
  collectionId: `0x${string}`;
  mintBalance: Array<{ stage: string; balance: number }> | undefined;
  onMintSuccess: (tokenIds: Array<string>) => void;
}

function extractTokenIds(result: any): Array<string> {
  const tokenIds: Array<string> = [];
  if (result?.events) {
    result.events.forEach((event: any) => {
      if (event?.type?.includes("BatchMintNftsEvent") && event?.data?.nft_objs) {
        event.data.nft_objs.forEach((nftObj: any) => {
          if (nftObj?.inner) {
            tokenIds.push(nftObj.inner);
          }
        });
      }
    });
  }
  return tokenIds;
}

export function MintStageCard({ stage, collectionId, mintBalance, onMintSuccess }: MintStageCardProps) {
  const { launchpadClient, connected, address } = useClients();
  const { refetch: refetchMintBalance } = useMintBalance(collectionId);
  const { refetch: refetchNFTs } = useCollectionNFTs(collectionId);
  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useGetAccountNativeBalance();

  const [minting, setMinting] = useState(false);
  const [mintAmount, setMintAmount] = useState(1);

  const now = new Date();
  const start = new Date(Number(stage.start_time) * 1000);
  const end = new Date(Number(stage.end_time) * 1000);
  const isActive = now >= start && now <= end;

  const walletBalance = Number(mintBalance?.find((b) => b.stage === stage.name)?.balance || 0);
  const insufficientBalance = !isLoadingNativeBalance && (!nativeBalance || nativeBalance.balance < oaptToApt(stage.mint_fee));

  const handleMintAmountChange = (value: number) => {
    setMintAmount(value);
  };

  async function handleMint() {
    if (!address || !launchpadClient) {
      toast.error("Connect your wallet to mint");
      return;
    }
    setMinting(true);
    try {
      const tx = await launchpadClient.mint_nft({
        arguments: [collectionId, mintAmount],
        type_arguments: [],
      });
      const result = await aptos.waitForTransaction({
        transactionHash: tx.hash,
      });
      await refetchMintBalance();
      await refetchNFTs();
      const newTokenIds = extractTokenIds(result);
      onMintSuccess(newTokenIds);
      if (newTokenIds.length > 0) {
        toast.success(`Successfully minted ${newTokenIds.length} NFT(s)`, {
          description: `Token IDs: ${newTokenIds.join(", ")}`,
        });
      } else {
        toast.success("Mint transaction submitted", { description: `Tx: ${tx.hash}` });
      }
    } catch (err: any) {
      toast.error("Mint failed", { description: err?.message || String(err) });
    } finally {
      setMinting(false);
    }
  }

  return (
    <GlassCard
      className={`mb-4 transition-all duration-300 pt-4 pb-2 gap-0 ${isActive ? "relative z-10 bg-gradient-to-br from-primary/70 via-primary/50 to-background border-1 border-primary/50 shadow-lg shadow-primary/20 ring-1 ring-primary/30" : "z-0 bg-muted/20 hover:bg-muted/30"}`}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between px-6">
        <CardTitle className="text-base flex-1">{stage.name}</CardTitle>
        {isActive && walletBalance > 0 && (
          <div className="flex flex-col gap-1">
            <span className="block text-right text-base text-foreground mt-1 font-semibold min-w-[120px]">
              Total: {((oaptToApt(stage.mint_fee) || 0) * mintAmount).toLocaleString()} MOVE
            </span>
            {insufficientBalance && (
              <Badge variant="destructive" className="text-xs">
                Insufficient balance: {nativeBalance?.balance.toLocaleString()} MOVE
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row md:items-center gap-2 pb-4 px-6">
        <div className="flex-1 text-xs space-y-1">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  Start: {start.toLocaleString()} <span className="text-muted-foreground">(Local Time)</span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="drop-shadow-lg">
                <p>UTC: {start.toUTCString()}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  End: {end.toLocaleString()} <span className="text-muted-foreground">(Local Time)</span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="drop-shadow-lg">
                <p>UTC: {end.toUTCString()}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div>Mint Fee: {oaptToApt(stage.mint_fee)} MOVE</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {walletBalance > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              Mint spots: <span className="text-foreground font-bold">{walletBalance}</span>
            </Badge>
          )}
          {walletBalance === 0 && (
            <Badge variant="destructive" className="text-xs">
              No spots left
            </Badge>
          )}

          <div className="flex items-center gap-2">
            {isActive && (
              <Input
                type="number"
                min={1}
                max={walletBalance}
                value={mintAmount}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(walletBalance, Number(e.target.value)));
                  handleMintAmountChange(value);
                }}
                className="w-20"
                disabled={minting || walletBalance === 0}
                aria-label="Mint amount"
              />
            )}
            {connected && (
              <Button
                disabled={!isActive || minting || walletBalance === 0 || insufficientBalance}
                className={!isActive ? "opacity-50 cursor-not-allowed" : ""}
                onClick={handleMint}
              >
                {minting ? "Minting..." : "Mint"}
              </Button>
            )}
            {!connected && isActive && <WalletSelector />}
          </div>
        </div>
      </CardContent>
    </GlassCard>
  );
}
