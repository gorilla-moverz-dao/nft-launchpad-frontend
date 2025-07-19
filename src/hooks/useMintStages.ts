import { useQuery } from '@tanstack/react-query';
import { launchpadClient } from '@/lib/aptos';

export interface MintStageInfo {
  name: string;
  mint_fee: string; // Move u64 is usually returned as string
  start_time: string;
  end_time: string;
  stage_type: number;
}

export const useMintStages = (collectionAddress: `0x${string}`) => {
  return useQuery<Array<MintStageInfo>>({
    queryKey: ['stages', collectionAddress],
    queryFn: async () => {
      const [res] = await launchpadClient.view.get_mint_stages_info({
        functionArguments: [collectionAddress],
        typeArguments: [],
      });
      return res as Array<MintStageInfo>;
    },
  });
};
