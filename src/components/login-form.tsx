"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signIn, signUp, stashPendingProfile } from "@/lib/auth";
import { bootstrap } from "@/lib/session";
import { useShapeStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { ConfigMissing, LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, User } from "lucide-react";
import { motion } from "framer-motion";
import { ShapeLogo } from "@/components/shape-logo";

const Silk = dynamic(() => import("@/components/silk"), { ssr: false });

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const authStatus = useShapeStore((s) => s.authStatus);
  const ready = useShapeStore((s) => s.ready);

  useEffect(() => {
    if (authStatus === "authenticated" && ready) router.replace("/");
  }, [authStatus, ready, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === "signup" && !name.trim()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        const userId = await signIn(email, password);
        await bootstrap(userId);
        router.replace("/");
        return;
      }

      const trimmedName = name.trim();
      const result = await signUp(email, password, trimmedName);
      stashPendingProfile({ name: trimmedName, avatar });
      if (result.status === "confirm") {
        setInfo("Revisá tu email para confirmar la cuenta. Después podés ingresar.");
        setMode("login");
        setLoading(false);
        return;
      }
      await bootstrap(result.userId);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos conectar con tu cuenta.");
      setLoading(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return <ConfigMissing />;
  }

  if (authStatus === "loading" || (authStatus === "authenticated" && !ready)) {
    return <LoadingScreen />;
  }

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    (mode === "login" || name.trim().length > 0) &&
    !loading;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="grid md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <ShapeLogo size={24} />
                <span className="text-sm font-semibold">Shape</span>
              </div>
              <h1 className="text-2xl font-medium tracking-tight mt-2">
                {mode === "signup" ? "Hola, ¿cómo te llamás?" : "Hola de nuevo"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "signup"
                  ? "Creá tu cuenta para guardar sueldo, gastos y metas."
                  : "Ingresá para ver tus finanzas."}
              </p>
            </div>

            <div className="flex rounded-xl border border-border overflow-hidden bg-muted/30">
              {([
                ["signup", "Crear cuenta"],
                ["login", "Ingresar"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value);
                    setError(null);
                    setInfo(null);
                  }}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium transition-colors",
                    mode === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "signup" && (
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
            )}

            {mode === "signup" && (
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
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vos@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="text-base"
              />
            </div>

            {error && <p className="text-sm text-expense">{error}</p>}
            {info && <p className="text-sm text-muted-foreground">{info}</p>}

            <Button type="submit" disabled={!canSubmit} className="w-full gap-2">
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-background/60 border-t-background animate-spin" />
              ) : null}
              {mode === "signup" ? "Empezar →" : "Ingresar →"}
            </Button>
          </form>

          <div className="relative hidden md:flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
              <Silk speed={5} scale={1} color="#2F48A1" noiseIntensity={1.5} rotation={0} />
            </div>

            <div className="relative z-10 text-center px-8 flex flex-col items-center gap-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ShapeLogo size={64} />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-medium text-white"
              >
                Tus finanzas,<br />en orden.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-white/60 leading-relaxed"
              >
                Seguí tus gastos, controlá tu sueldo y alcanzá tus metas.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2"
              >
                {[
                  { label: "Balance", value: "$284.500", color: "text-emerald-300" },
                  { label: "Gastos del mes", value: "$65.300", color: "text-red-300" },
                  { label: "Meta: Vacaciones", value: "67%", color: "text-white/80" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{item.label}</span>
                    <span className={cn("text-xs font-mono font-semibold", item.color)}>{item.value}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
