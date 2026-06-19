"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useShapeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, User } from "lucide-react";
import { motion } from "framer-motion";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const setUserProfile = useShapeStore((s) => s.setUserProfile);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setUserProfile({ name: name.trim(), avatar });
    router.replace("/");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="grid md:grid-cols-2">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
                  <span className="text-background text-xs font-bold">S</span>
                </div>
                <span className="text-sm font-semibold">Shape</span>
              </div>
              <h1 className="text-2xl font-medium tracking-tight mt-2">Hola, ¿cómo te llamás?</h1>
              <p className="text-sm text-muted-foreground">
                Configurá tu perfil para empezar a usar Shape.
              </p>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
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
                {avatar ? "Foto seleccionada · click para cambiar" : "Subir foto (opcional)"}
              </p>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Tu nombre</Label>
              <Input
                id="name"
                placeholder="Dante"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="text-base"
              />
            </div>

            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-background/60 border-t-background animate-spin" />
              ) : null}
              Empezar →
            </Button>
          </form>

          {/* Decorative panel */}
          <div className="relative hidden md:flex flex-col items-center justify-center bg-foreground text-background p-8 gap-6">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              {Array.from({ length: 8 }).map((_, row) =>
                Array.from({ length: 5 }).map((_, col) => (
                  <div
                    key={`${row}-${col}`}
                    className="absolute w-1.5 h-1.5 rounded-full bg-white"
                    style={{ top: `${row * 14 + 4}%`, left: `${col * 22 + 4}%` }}
                  />
                ))
              )}
            </div>

            <div className="relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 rounded-2xl bg-income flex items-center justify-center mx-auto mb-6"
              >
                <span className="text-3xl font-bold text-white">S</span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-medium mb-3"
              >
                Tus finanzas,<br />en orden.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-background/60 leading-relaxed"
              >
                Seguí tus gastos, controlá tu sueldo y alcanzá tus metas.
              </motion.p>
            </div>

            {/* Stats preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="relative z-10 w-full bg-white/10 rounded-xl p-4 space-y-2"
            >
              {[
                { label: "Balance", value: "$284.500", color: "text-income" },
                { label: "Gastos del mes", value: "$65.300", color: "text-red-400" },
                { label: "Meta: Vacaciones", value: "67%", color: "text-background/80" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-background/60">{item.label}</span>
                  <span className={cn("text-xs font-mono font-semibold", item.color)}>{item.value}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
