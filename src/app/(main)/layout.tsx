import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserGuard } from "@/components/user-guard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={300}>
      <UserGuard>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 md:ml-52 min-h-screen flex flex-col pb-16 md:pb-0">
            {children}
          </div>
        </div>
      </UserGuard>
    </TooltipProvider>
  );
}
