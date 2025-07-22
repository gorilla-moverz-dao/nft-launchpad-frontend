import { Link } from "@tanstack/react-router";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { Menu } from "lucide-react";
import { WalletSelector } from "./WalletSelector";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { SINGLE_COLLECTION_MODE } from "@/constants";

export default function Header() {
  const { connected } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const NavigationLinks = () => (
    <>
      {!SINGLE_COLLECTION_MODE ? (
        <div className="px-2 font-bold">
          <Link to="/" onClick={() => setIsOpen(false)}>
            Home
          </Link>
        </div>
      ) : (
        <div className="px-2 font-bold">
          <Link to="/mint" onClick={() => setIsOpen(false)}>
            Mint
          </Link>
        </div>
      )}

      {connected && (
        <div className="px-2 font-bold">
          <Link to="/my-nfts" onClick={() => setIsOpen(false)}>
            My NFTs
          </Link>
        </div>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
              <img src="/favicon.png" alt="NFT Launchpad Logo" className="h-10 w-10" />
              <span className="font-bold text-lg text-white tracking-wide">NFT Launchpad</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavigationLinks />
            <div className="px-2 font-bold flex-1" />
          </nav>

          {/* Desktop Wallet Selector */}
          <div className="hidden md:flex items-center">
            <div className="px-2 font-bold">
              <WalletSelector />
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-black/60 backdrop-blur-xl border-l border-white/20">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex flex-col gap-2 px-3">
                    <NavigationLinks />
                  </div>
                  <div className="pt-2 px-4">
                    <WalletSelector />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
