import { NETWORKS } from "./lib/networks";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const NETWORK = import.meta.env?.VITE_NETWORK || "TESTNET";

export const LAUNCHPAD_MODULE_ADDRESS = "0xc0f53cd6d0a7ae1b6f5aa700742f92b2d0670e0751295c5a0f1e647d6c681459";
export const COLLECTION_ID = "";
export const SINGLE_COLLECTION_MODE = COLLECTION_ID.length > 0;
export const MOVE_NETWORK = NETWORKS[NETWORK as keyof typeof NETWORKS];
