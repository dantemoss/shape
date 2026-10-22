export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-income border-t-transparent animate-spin" />
    </div>
  );
}

export function ConfigMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-lg font-medium">Falta configurar Supabase</h1>
        <p className="text-sm text-muted-foreground">
          Definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para guardar tus datos.
        </p>
      </div>
    </div>
  );
}
