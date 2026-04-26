"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, where, QueryConstraint } from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { Incident } from "../types";

export function useIncidents(filterByAssignee?: string, filterByReporter?: string) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We only use where() constraints in Firestore, and do sorting client-side
    // to avoid requiring composite indexes for this hackathon MVP.
    const constraints: QueryConstraint[] = [];
    
    if (filterByAssignee) {
      constraints.push(where("assignedTo", "array-contains", filterByAssignee));
    }
    if (filterByReporter) {
      constraints.push(where("reporterId", "==", filterByReporter));
    }

    const q = query(collection(db, "incidents"), ...constraints);

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const incidentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Incident[];
        
        // Client-side sort by createdAt desc
        incidentData.sort((a, b) => b.createdAt - a.createdAt);
        
        setIncidents(incidentData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore Error in useIncidents:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterByAssignee, filterByReporter]);

  return { incidents, loading, error };
}
