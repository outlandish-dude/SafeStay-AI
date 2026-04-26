"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Role } from "@/types";

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
        
        if (userDoc.exists()) {
          const userRole = userDoc.data().role as Role;
          router.push(`/dashboard/${userRole}`);
        } else {
          // Fallback if no user doc
          router.push("/dashboard/guest");
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          name,
          role,
          createdAt: Date.now()
        });

        router.push(`/dashboard/${role}`);
      }
    } catch (err) {
      setError((err as Error).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const seedDemoAction = async () => {
    // A quick hack function to seed easy accounts for demo
    setEmail("admin@safestay.com");
    setPassword("password123");
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to access your dashboard" : "Sign up to join the platform"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="John Doe" 
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input 
                required 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 text-slate-900 dark:text-slate-100"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="guest" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Guest</option>
                  <option value="staff" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Staff</option>
                  <option value="responder" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">First Responder</option>
                  <option value="admin" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Administrator</option>
                </select>
              </div>
            )}
            
            {isLogin && (
              <div className="text-sm text-right">
                <button type="button" onClick={seedDemoAction} className="text-blue-600 hover:underline">
                  Use Demo Admin Account
                </button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
            </Button>
            <div className="text-sm text-center text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                className="text-blue-600 hover:underline font-medium"
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
