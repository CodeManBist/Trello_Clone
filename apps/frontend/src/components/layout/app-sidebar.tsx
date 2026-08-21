import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Building2,
  LogOut,
  ChevronsUpDown,
  Mail,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/context/AuthContext";

const navigation = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
  },
  {
    title: "Invitations",
    url: "/invitations",
    icon: Mail,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const initials =
    user?.username
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-neutral-200"
    >
      {/* Logo */}
      <SidebarHeader className="h-14 justify-center border-b border-neutral-200 px-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <span className="text-sm font-bold tracking-tight">
              T
            </span>
          </div>

          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-none tracking-tight">
              Taskly
            </span>

            <span className="mt-1 text-[11px] leading-none text-neutral-500">
              Workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Menu
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-9 rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-neutral-900 data-[active=true]:font-medium data-[active=true]:text-white data-[active=true]:hover:bg-neutral-900"
                    >
                      <Link
                        to={item.url}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User */}
      <SidebarFooter className="border-t border-neutral-200 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-11 rounded-md transition-colors hover:bg-neutral-100">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                    {initials}
                  </span>

                  <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
                    {user?.username}
                  </span>

                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-neutral-400 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-popper-anchor-width] min-w-48"
              >
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer"
                >
                  <Link
                    to="/settings"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/signin");
                  }}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}