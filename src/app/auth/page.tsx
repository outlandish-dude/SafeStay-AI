"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Role } from "@/types";
import { isAdminAllowlisted, normalizePublicSignupRole, roleHome } from "@/lib/access-control";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("guest");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        router.push(roleHome(userDoc.exists() ? (userDoc.data().role as Role) : "guest"));
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const safeRole = normalizePublicSignupRole(role);
        const now = Date.now();

        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          displayName: name,
          name,
          role: safeRole,
          provider: "password",
          status: "active",
          createdAt: now,
          updatedAt: now,
          lastLogin: now,
          isAdminAllowlisted: false,
          teamMember: false,
        });

        router.push(roleHome(safeRole));
      }
    } catch (err) {
      setError((err as Error).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const allowlisted = isAdminAllowlisted(user.email);
      const docRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(docRef);
      const now = Date.now();
      const existingRole = snapshot.exists() ? (snapshot.data().role as Role) : "guest";
      const roleForLogin = allowlisted ? "admin" : existingRole === "admin" ? "guest" : existingRole;

      await setDoc(
        docRef,
        {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || user.email || "SafeStay User",
          name: user.displayName || user.email || "SafeStay User",
          role: roleForLogin,
          provider: "google",
          status: snapshot.exists() ? snapshot.data().status || "active" : "active",
          createdAt: snapshot.exists() ? snapshot.data().createdAt || now : now,
          updatedAt: now,
          lastLogin: now,
          isAdminAllowlisted: allowlisted,
          teamMember: allowlisted,
        },
        { merge: true }
      );

      router.push(roleHome(roleForLogin));
    } catch (err) {
      setError((err as Error).message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const seedDemoAction = async () => {
    setEmail("admin@safestay.com");
    setPassword("password123");
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4 text-slate-950 dark:bg-neutral-950 dark:text-slate-50">
      <Card className="w-full max-w-md border-stone-200 bg-white/95 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-slate-950 text-white rounded-lg flex items-center justify-center dark:bg-white dark:text-neutral-950">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-950 dark:text-white">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          <CardDescription className="dark:text-slate-400">
            {isLogin ? "Sign in to access your dashboard" : "Public signup creates a guest or staff account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2 dark:bg-red-950/40 dark:text-red-200">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Public Role</label>
                <select className="app-select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="guest">Guest</option>
                  <option value="staff">Staff</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400">Admins must use allowlisted Google sign-in. First responders are assigned by admins.</p>
              </div>
            )}

            {isLogin && (
              <div className="text-sm text-right">
                <button type="button" onClick={seedDemoAction} className="text-slate-700 hover:underline dark:text-slate-300">
                  Use Demo Admin Account
                </button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-stone-200" disabled={loading}>
              {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
            <Button type="button" variant="outline" className="w-full border-stone-300 bg-white font-bold text-slate-950 hover:bg-stone-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800" disabled={loading} onClick={handleGoogleSignIn}>
              Continue with Google
            </Button>
            <div className="text-sm text-center text-slate-500 dark:text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="text-slate-950 hover:underline font-medium dark:text-white"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
