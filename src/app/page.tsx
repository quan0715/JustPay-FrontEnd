"use client";

import { useAuth } from "@/hooks/useAuth";
import { USDCManager } from "@/components/USDCManager";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* <WelcomeHero /> */}

        {isAuthenticated && (
          <div className="space-y-8">
            {/* <TokenBalances /> */}
            <USDCManager />
          </div>
        )}
      </div>
    </main>
  );
}
