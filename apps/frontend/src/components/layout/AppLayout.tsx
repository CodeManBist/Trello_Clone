import { useLocation } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/layout/app-sidebar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/organizations": "Organizations",
  "/settings": "Settings",
  "/boards": "Boards",
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {

  const location = useLocation();
  const title =
    pageTitles[
      Object.keys(pageTitles).find((path) =>
        location.pathname.startsWith(path)
      ) ?? ""
    ] ?? "Taskly";

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="bg-neutral-50">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-sm">
          <SidebarTrigger className="text-neutral-500 transition-colors hover:text-neutral-900" />
          <Separator orientation="vertical" className="h-5 bg-neutral-200" />
          <h1 className="text-sm font-medium tracking-tight text-neutral-900">
            {title}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;