"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Megaphone, X } from "lucide-react";

export function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch broadcasts from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const q = query(
      collection(db, "broadcasts"),
      where("createdAt", ">", yesterday),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0];
        setBroadcast({ id: latest.id, ...latest.data() });
      } else {
        setBroadcast(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!broadcast || broadcast.id === dismissedId) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-top-10 fade-in duration-500">
      <div className="max-w-4xl w-full">
        <div className="bg-red-600 border border-red-700 text-white shadow-2xl relative overflow-hidden rounded-lg p-4">
          <div className="absolute top-0 right-0 bottom-0 w-32 bg-red-700 opacity-50 mix-blend-multiply blur-xl rounded-full"></div>
          <Megaphone className="h-6 w-6 text-white absolute left-4 top-4 animate-pulse" />
          <div className="pl-8">
            <h5 className="text-xl font-black uppercase tracking-widest mb-1 flex items-center justify-between">
              <span>{broadcast.template}</span>
              <button 
                onClick={() => setDismissedId(broadcast.id)}
                className="text-red-200 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </h5>
            <div className="text-sm md:text-base font-bold text-red-50">
              {broadcast.message}
            </div>
            <p className="text-[10px] font-medium text-red-300 uppercase tracking-widest mt-2">
              Broadcasted by {broadcast.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
