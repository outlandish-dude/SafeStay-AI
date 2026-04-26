"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { User } from "../../types";
import { isAdminAllowlisted } from "@/lib/access-control";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, userData: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          const provider = user.providerData.some((item) => item.providerId === "google.com") ? "google" : "password";
          const allowlisted = isAdminAllowlisted(user.email);
          const now = Date.now();
          
          if (docSnap.exists()) {
            const existing = docSnap.data() as User;
            const hardenedRole = provider === "google" && allowlisted ? "admin" : existing.role === "admin" && !allowlisted ? "guest" : existing.role;
            const updatedUser: User = {
              ...existing,
              uid: user.uid,
              email: user.email || existing.email,
              displayName: user.displayName || existing.displayName || existing.name,
              name: user.displayName || existing.name || user.email || "SafeStay User",
              role: hardenedRole,
              provider,
              status: existing.status || "active",
              updatedAt: now,
              lastLogin: now,
              isAdminAllowlisted: allowlisted,
              teamMember: allowlisted,
            };
            await setDoc(docRef, updatedUser, { merge: true });
            setUserData(updatedUser);
          } else {
            const newUser: User = {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || user.email || "SafeStay User",
              name: user.displayName || user.email || "SafeStay User",
              role: provider === "google" && allowlisted ? "admin" : "guest",
              provider,
              status: "active",
              createdAt: now,
              updatedAt: now,
              lastLogin: now,
              isAdminAllowlisted: allowlisted,
              teamMember: allowlisted,
            };
            await setDoc(docRef, newUser, { merge: true });
            setUserData(newUser);
          }
        } catch (error) {
          console.error("Error fetching user data", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
