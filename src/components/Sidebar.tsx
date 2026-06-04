import { useState } from "react";
import { Announcement01, BarChart01, ChevronLeft, ChevronRight, LayoutGrid01, Settings01, Target01, Users01 } from "@untitledui/icons";
import { NavList } from "@/components/application/app-navigation/base-components/nav-list";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { cx } from "@/utils/cx";
import oiLogo from "@/assets/oi-logo.svg";

const navItems: NavItemType[] = [
  { label: "Dashboard", icon: LayoutGrid01, href: "#/dashboard" },
  { label: "Meta Leads", icon: Users01, href: "#/leads" },
  { label: "Campaigns", icon: Announcement01, href: "#/campaigns" },
  { label: "Audience", icon: Target01, href: "#/audience" },
  { label: "Analytics", icon: BarChart01, href: "#/analytics" },
  { label: "Settings", icon: Settings01, href: "#/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const hash = window.location.hash.replace("#", "") || "/leads";
  const activeUrl = hash;

  return (
    <aside
      className={cx(
        "hidden lg:flex shrink-0 flex-col bg-primary_alt border-r border-secondary transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-center px-4 py-3 border-b border-secondary min-h-[56px]">
        <img
          src={oiLogo}
          alt="OI"
          className={cx(
            "object-contain transition-all duration-300",
            collapsed ? "w-5 h-5" : "max-h-6 w-auto",
          )}
        />
      </div>

      <div className="flex-1">
        <NavList
          activeUrl={activeUrl}
          items={navItems}
          className={collapsed ? "px-2" : "px-3"}
        />
      </div>

      <div className="border-t border-secondary">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center py-3 text-fg-quaternary transition-colors hover:bg-primary_hover hover:text-fg-quaternary_hover"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-4 stroke-[2.5px]" />
          ) : (
            <ChevronLeft className="size-4 stroke-[2.5px]" />
          )}
        </button>
      </div>
    </aside>
  );
}
