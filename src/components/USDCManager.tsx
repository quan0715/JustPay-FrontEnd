"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenBalances } from "@/components/TokenBalances";
import { TransferReceive } from "@/components/TransferReceive";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

export function USDCManager() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardContent>
          <p className="text-center py-4">請先連接錢包並完成認證</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="balance" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="balance">USDC 餘額</TabsTrigger>
        <TabsTrigger value="transfer">轉帳 / 收款</TabsTrigger>
      </TabsList>
      <TabsContent value="balance">
        <TokenBalances />
      </TabsContent>
      <TabsContent value="transfer">
        <TransferReceive />
      </TabsContent>
    </Tabs>
  );
}
