"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShapeStore } from "@/lib/store";

export function UserGuard({ children }: { children: React.ReactNode }) {
  const userProfile = useShapeStore((s) => s.userProfile);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !userProfile) {
      router.replace("/login");
    }
  }, [hydrated, userProfile, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-income border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!userProfile) return null;

  return <>{children}</>;
}
