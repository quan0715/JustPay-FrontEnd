import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";

// Stick at the top of the page
// Make Bg-Transparent with backdrop-blur-sm

// Add Page Title
// Add Connect Button

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 bg-transparent backdrop-blur-sm">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="Just Pay Logo"
            width={32}
            height={32}
            className="rounded-full"
          />
          <h1 className="text-xl font-bold">Just Pay</h1>
        </div>
        <ConnectButton label="連接錢包" />
      </div>
    </div>
  );
}
