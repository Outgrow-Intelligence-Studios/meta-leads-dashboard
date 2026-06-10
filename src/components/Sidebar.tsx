import { Announcement01, BarChart01, ChevronLeft, ChevronRight, LayoutGrid01, Settings01, Target01, Users01 } from "@untitledui/icons";

import { cx } from "@/utils/cx";
import columbusLogo from "@/assets/columbus-logo.png";

const FAVICON_URL = "https://www.columbus-clean.com/wp-content/uploads/2025/09/columbus-favicon-c-3.png";

type IconType = typeof Users01;

type NavItem = {
  label: string;
  icon: IconType;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid01, href: "#/dashboard" },
  { label: "Meta Leads", icon: Users01, href: "#/leads" },
  { label: "Campaigns", icon: Announcement01, href: "#/campaigns" },
  { label: "Audience", icon: Target01, href: "#/audience" },
  { label: "Analytics", icon: BarChart01, href: "#/analytics" },
  { label: "Settings", icon: Settings01, href: "#/settings" },
];

function NavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cx(
        "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
        collapsed ? "h-11 w-11 justify-center" : "h-11 px-3",
        active
          ? "bg-[#ed1c24]/10 text-[#ed1c24]"
          : "text-tertiary hover:bg-primary_hover hover:text-primary",
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#ed1c24]" />
      )}

      <Icon
        className={cx(
          "size-5 shrink-0 transition-colors",
          active ? "text-[#ed1c24]" : "text-current",
        )}
        strokeWidth={active ? 2.5 : 2}
      />

      <span
        className={cx(
          "truncate transition-all duration-300",
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
        )}
      >
        {item.label}
      </span>

      {collapsed && active && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ed1c24]" />
      )}
    </a>
  );
}

export default function Sidebar({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}) {
  const hash = window.location.hash.replace("#", "") || "/leads";

  return (
    <aside
      style={{
        width: collapsed ? 72 : 256,
      }}
      className={cx(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-secondary bg-primary_alt transition-[width] duration-300 ease-out",
      )}
    >
      <div
        className={cx(
          "flex shrink-0 items-center border-b border-secondary transition-all duration-300",
          collapsed ? "h-16 justify-center px-2" : "h-16 gap-3 px-5",
        )}
      >
        <div
          className={cx(
            "flex shrink-0 items-center justify-center overflow-hidden transition-all duration-300",
            collapsed ? "h-9 w-9 rounded-lg" : "h-9 w-9 rounded-lg",
          )}
        >
          {collapsed ? (
            <img
              key="favicon"
              src={FAVICON_URL}
              alt="Columbus Clean"
              className="h-9 w-9 object-contain animate-in fade-in zoom-in-95 duration-300"
            />
          ) : (
            <img
              key="logo"
              src={columbusLogo}
              alt="Columbus Clean"
              className="h-7 w-auto object-contain animate-in fade-in zoom-in-95 duration-300"
            />
          )}
        </div>

        <div
          className={cx(
            "flex min-w-0 flex-col transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          <span className="truncate text-sm font-semibold text-primary">Columbus Clean</span>
          <span className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Leads CRM
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const itemHash = item.href.replace("#", "");
            const isActive = hash === itemHash;
            return (
              <li key={item.href}>
                <NavLink item={item} collapsed={collapsed} active={isActive} />
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-secondary p-3">
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cx(
            "flex items-center gap-3 rounded-xl text-sm font-medium text-tertiary transition-all duration-200 hover:bg-primary_hover hover:text-primary",
            collapsed ? "h-11 w-11 justify-center" : "h-11 w-full px-3",
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-5" strokeWidth={2.5} />
          ) : (
            <>
              <ChevronLeft className="size-5" strokeWidth={2.5} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
