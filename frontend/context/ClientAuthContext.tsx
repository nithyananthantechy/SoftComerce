"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getClientMe, clientLogout } from "@/lib/api";

interface ClientData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  is_seller?: boolean;
  created_at?: string;
  is_admin?: boolean;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
}

interface ClientAuthContextType {
  client: ClientData | null;
  isLoading: boolean;
  refreshClient: () => Promise<void>;
  logout: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType>({
  client: null,
  isLoading: true,
  refreshClient: async () => {},
  logout: async () => {},
});

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const refreshClient = async () => {
    try {
      const data = await getClientMe();
      setClient(data);
    } catch {
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      setIsLoading(false);
      return;
    }
    refreshClient();
  }, [pathname]);

  const logout = async () => {
    await clientLogout();
    setClient(null);
  };

  return (
    <ClientAuthContext.Provider value={{ client, isLoading, refreshClient, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export const useClientAuth = () => useContext(ClientAuthContext);
