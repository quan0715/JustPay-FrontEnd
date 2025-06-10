"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
// Stick at the top of the page
// Make Bg-Transparent with backdrop-blur-sm

// Add Page Title
// Add Connect Button

export default function Navbar() {
  const { isAuthenticated } = useAuth();

  // 僅在認證後顯示導航欄
  if (!isAuthenticated) return null;

  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex ">
          <Link href="/" className="mr-6 flex items-center space-x-2 p-2">
            <Image
              src="/logo.png"
              alt="JustPay Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="font-bold">JustPay</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80"
            >
              Home
            </Link>
            <Link
              href="/transfer"
              className="transition-colors hover:text-foreground/80"
            >
              Cross-Chain Transfer
            </Link>
            <Link
              href="/receive"
              className="transition-colors hover:text-foreground/80"
            >
              收款碼
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <ConnectButton
            chainStatus="icon"
            accountStatus="address"
            showBalance={false}
          />
        </div>
      </div>
    </header>
  );
}
