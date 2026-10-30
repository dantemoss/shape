import { Sidebar } from "@/components/sidebar";
import { StatusBanners } from "@/components/status-banners";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserGuard } from "@/components/user-guard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={300}>
      <UserGuard>
        <div className="flex min-h-dvh min-w-0 overflow-x-clip">
          <Sidebar />
          <div className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-clip pb-[calc(4.6rem+env(safe-area-inset-bottom))] md:ml-56 md:pb-0">
            <StatusBanners />
            {children}
          </div>
        </div>
      </UserGuard>
    </TooltipProvider>
  );
}
