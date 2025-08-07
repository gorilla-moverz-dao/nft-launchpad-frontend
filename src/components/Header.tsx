import { Link, useLocation } from "@tanstack/react-router";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { Crown, Menu, Palette, Sparkles, Zap } from "lucide-react";
import { WalletSelector } from "./WalletSelector";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { SINGLE_COLLECTION_MODE } from "@/constants";

export default function Header() {
  const { connected } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems: Array<{ to: string; icon: React.ElementType; title: string; description: string; accent: string }> = [];
  if (!SINGLE_COLLECTION_MODE) {
    menuItems.push(
      {
        to: "/",
        icon: Zap,
        title: "Mint",
        description: "Create and mint new NFTs",
        accent: "from-yellow-500/20 to-orange-500/20",
      },
      {
        to: "/collections",
        icon: Palette,
        title: "Collections",
        description: "Browse and explore NFT collections",
        accent: "from-purple-500/20 to-pink-500/20",
      },
    );
  } else {
    menuItems.push({
      to: "/mint",
      icon: Zap,
      title: "Mint",
      description: "Create and mint new NFTs",
      accent: "from-yellow-500/20 to-orange-500/20",
    });
  }

  if (connected) {
    menuItems.push({
      to: "/my-nfts",
      icon: Crown,
      title: "My NFTs",
      description: "View and manage your NFT collection",
      accent: "from-emerald-500/20 to-teal-500/20",
    });
  }

  const NavigationLinks = () => {
    const isActivePath = (path: string) => {
      if (path === "/" && !SINGLE_COLLECTION_MODE) {
        return location.pathname === "/" || location.pathname.startsWith("/mint");
      }
      if (path === "/mint" && SINGLE_COLLECTION_MODE) {
        return location.pathname === "/mint" || location.pathname.startsWith("/mint");
      }
      if (path === "/collections") {
        return location.pathname.startsWith("/collections");
      }
      if (path === "/my-nfts") {
        return location.pathname === "/my-nfts";
      }
      return false;
    };

    return (
      <>
        {menuItems.map((item) => (
          <div key={item.to} className="px-2">
            <Link
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 ${isActivePath(item.to) ? "font-bold" : "font-normal"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          </div>
        ))}
      </>
    );
  };

  const NavigationMenu = () => {
    return (
      <div className="grid gap-2 p-4 w-100">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setNavMenuOpen(false)}
            className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/10 p-4 transition-all duration-200 hover:border-white/20 hover:bg-black/30 hover:shadow-lg hover:scale-[1.02]"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br ${item.accent || "from-white/5 to-white/10"} group-hover:from-white/10 group-hover:to-white/20 transition-all duration-200`}
              >
                <item.icon className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white group-hover:text-white/90 transition-colors">{item.title}</h3>
                  <Sparkles className="h-3 w-3 text-white/40 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
                <p className="text-sm text-white/60 group-hover:text-white/70 transition-colors mt-1">{item.description}</p>
              </div>
            </div>
            <div
              className={`absolute inset-0 bg-gradient-to-r ${item.accent || "from-transparent via-white/5 to-transparent"} opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <DropdownMenu open={navMenuOpen} onOpenChange={setNavMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-lg p-2 focus:outline-none cursor-pointer"
                  style={{ textDecoration: "none" }}
                >
                  <img src="/favicon.png" alt="NFT Launchpad Logo" className="h-10 w-10" />
                  <span className="font-bold text-lg text-white tracking-wide">NFT Launchpad</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="border-white/10 bg-black/80 backdrop-blur-xl p-0 shadow-2xl">
                <NavigationMenu />
              </DropdownMenuContent>
            </DropdownMenu>
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
