"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { NAV_ITEMS } from "@/lib/constants"
import { signOut } from "@/features/auth/actions/login"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <TooltipProvider>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.enabled ? (
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                      >
                        <Link href={item.url}>
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger render={<div className="w-full" />}>
                          <SidebarMenuButton
                            className="opacity-50 cursor-not-allowed"
                            aria-disabled="true"
                            tabIndex={-1}
                            onClick={(e) => e.preventDefault()}
                          >
                            <item.icon className="size-5" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.title} — available in a future update
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </TooltipProvider>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Separator />
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm text-sidebar-foreground/70 truncate">
            DataBridge AI
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
