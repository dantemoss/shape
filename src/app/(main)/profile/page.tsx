"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useShapeStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, LogOut, User } from "lucide-react";

export default function ProfilePage() {
  const userProfile = useShapeStore((s) => s.userProfile);
  const setUserProfile = useShapeStore((s) => s.setUserProfile);
  const clearUserProfile = useShapeStore((s) => s.clearUserProfile);
  const router = useRouter();

  const [name, setName] = useState(userProfile?.name ?? "");
  const [avatar, setAvatar] = useState<string | null>(userProfile?.avatar ?? null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setUserProfile({ name: name.trim(), avatar });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogout() {
    clearUserProfile();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
        <h1 className="text-lg font-medium">Mi perfil</h1>
      </div>

      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-start gap-3">
            <Label>Foto de perfil</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group w-20 h-20 rounded-full border-2 border-dashed border-border hover:border-income transition-colors flex items-center justify-center overflow-hidden bg-muted"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera size={18} className="text-white" />
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              {avatar ? "Click para cambiar" : "Subir foto (opcional)"}
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Tu nombre"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={!name.trim()} className="flex-1">
              {saved ? "¡Guardado!" : "Guardar cambios"}
            </Button>
          </div>
        </form>

        {/* Logout */}
        <div className="mt-10 pt-6 border-t border-border">
          <Button
            variant="outline"
            className="gap-2 text-muted-foreground hover:text-expense hover:border-expense/50"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
