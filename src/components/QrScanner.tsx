"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export interface QrScannerProps {
  onResult: (result: string) => void;
}

const QrScanner = ({ onResult }: QrScannerProps) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText: string) => {
        onResult(decodedText);
        scanner.clear();
      },
      (errorMessage: string) => {
        console.warn(errorMessage);
      }
    );

    return () => {
      scanner.clear();
    };
  }, [onResult]);

  return <div id="qr-reader" className="w-full" />;
};

export default QrScanner;
