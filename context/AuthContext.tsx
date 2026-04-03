"use client";

import React, { createContext, useContext } from "react";
import { useFirebaseAuth, AppUser } from "@/hooks/firebase/useFirebaseAuth";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithEmail: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authState = useFirebaseAuth();
  
  return (
    <AuthContext.Provider value={authState}>
        {children}
    </AuthContext.Provider>
  );
};
