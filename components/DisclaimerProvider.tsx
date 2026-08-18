"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import DisclaimerModal from "@/components/DisclaimerModal";

const ACCEPTED_KEY = "swasthx-disclaimer-accepted";

type DisclaimerContextValue = {
  navigateWithDisclaimer: (url: string) => void;
};

const DisclaimerContext = createContext<DisclaimerContextValue | null>(null);

export function DisclaimerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const router = useRouter();

  const navigateWithDisclaimer = (url: string) => {
    const alreadyAccepted =
      typeof window !== "undefined" && sessionStorage.getItem(ACCEPTED_KEY) === "true";

    if (alreadyAccepted) {
      router.push(url);
      return;
    }

    setPendingUrl(url);
    setIsOpen(true);
  };

  const handleAccept = () => {
    sessionStorage.setItem(ACCEPTED_KEY, "true");
    setIsOpen(false);
    if (pendingUrl) router.push(pendingUrl);
  };

  const handleClose = () => setIsOpen(false);

  return (
    <DisclaimerContext.Provider value={{ navigateWithDisclaimer }}>
      {children}
      <DisclaimerModal isOpen={isOpen} onClose={handleClose} onAccept={handleAccept} />
    </DisclaimerContext.Provider>
  );
}

export function useDisclaimer(): DisclaimerContextValue {
  const ctx = useContext(DisclaimerContext);
  if (!ctx) {
    throw new Error("useDisclaimer must be used within a DisclaimerProvider");
  }
  return ctx;
}
