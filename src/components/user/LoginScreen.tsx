"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

export function LoginScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20">
              <Image
                src="/logo.png"
                alt="JustPay Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to JustPay
          </CardTitle>
          <CardDescription>
            Connect your wallet to start using multi-chain payment services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Login Steps</h3>
              <ul className="text-sm space-y-2 list-disc pl-5">
                <li>Click the &quot;Connect Wallet&quot; button below</li>
                <li>Select your preferred wallet (e.g. MetaMask)</li>
                <li>Confirm the connection request</li>
                <li>Once connected, you can use all features of JustPay</li>
              </ul>
            </div>

            <div className="flex justify-center py-2">
              <ConnectButton
                chainStatus="icon"
                accountStatus="address"
                showBalance={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
