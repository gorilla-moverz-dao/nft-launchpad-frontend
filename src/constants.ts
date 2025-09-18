import { NETWORKS } from "./lib/networks";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const NETWORK = import.meta.env?.VITE_NETWORK || "TESTNET";

export const LAUNCHPAD_MODULE_ADDRESS = "0xe4fa259d7f337bf12723b7fc3606399955758cdef49a0303ce8d265f6dbe7e71";
export const COLLECTION_ID = "";
export const SINGLE_COLLECTION_MODE = COLLECTION_ID.length > 0;
export const MOVE_NETWORK = NETWORKS[NETWORK as keyof typeof NETWORKS];
