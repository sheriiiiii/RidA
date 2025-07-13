"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Bus,
  Ticket,
  Users,
  User,
  LogOut,
  Settings,
  Route,
  MapPinned,
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
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navigationItems = [
    { name: "Admin Panel", href: "/admin/dashboard", icon: Home },
    { name: "Trip Routes", href: "/admin/dashboard/manage-route", icon: Route },
    { name: "Van Fleet", href: "/admin/dashboard/manage-van", icon: Bus },
    {
      name: "Trip Planner",
      href: "/admin/dashboard/manage-trip",
      icon: MapPinned,
    },
    {
      name: "Seat Selection",
      href: "/admin/dashboard/manage-seat",
      icon: Users,
    },
    {
      name: "Ticket Logs",
      href: "/admin/dashboard/manage-ticket",
      icon: Ticket,
    },
  ];

  const displayName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Admin";

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <Sidebar className="border-r bg-white w-64 shadow-2xl z-50">
      <SidebarHeader className="p-6 border-b bg-red border-gray-100 shadow-sm">
        <div className="flex items-center gap-1">
          <Image
            src="/assets/rida.png"
            alt="RidA Logo"
            width={65}
            height={65}
            className="object-contain"
          />
          <span className="text-sm font-semibold text-[#0f172a]">
            Welcome Admin
          </span>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="flex-1 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pb-3 text-xs font-medium text-black-500 uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "w-full justify-start rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-sky-200 text-sky-800 font-semibold"
                          : "text-[#0f172a] hover:bg-sky-100 hover:text-sky-700"
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3"
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Account Footer */}
      <SidebarFooter className="border-t border-gray-100 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full justify-start rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-sky-500 text-white text-sm font-medium">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">
                        Admin Account
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                className="w-48 ml-2 shadow-lg border border-gray-200 rounded-lg"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-2 text-sm px-3 py-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 text-sm px-3 py-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 px-3 py-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
