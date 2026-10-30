import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f4f5f7] p-4 sm:p-6">
      <div className="w-full max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}
