import { Link } from "@tanstack/react-router";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "./WalletSelector";
import ModeToggle from "./mode-toggle";

export default function Header() {
  const { connected } = useWallet();
  return (
    <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center ">
            <Link to="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
              <img src="/favicon.png" alt="NFT Launchpad Logo" className="h-10 w-10" />
              <span className="font-bold text-lg text-white tracking-wide">NFT Launchpad</span>
            </Link>
          </div>

          <nav className="flex items-center gap-6">
            <div className="px-2 font-bold">
              <Link to="/">Home</Link>
            </div>

            <div className="px-2 font-bold">
              <Link to="/mint">Mint</Link>
            </div>

            {connected && (
              <div className="px-2 font-bold">
                <Link to="/my-nfts">My NFTs</Link>
              </div>
            )}

            <div className="px-2 font-bold flex-1" />
          </nav>

          <div className="flex items-center">
            <div className="px-2 font-bold">
              <ModeToggle />
            </div>

            <div className="px-2 font-bold">
              <WalletSelector />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
