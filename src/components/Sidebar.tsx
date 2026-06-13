import { useCallback, useState } from "react";
import { Announcement01, BarChart01, ChevronLeft, ChevronRight, LayoutGrid01, Lock01, LogOut01, Mail01, Settings01, Target01, Users01 } from "@untitledui/icons";

import { cx } from "@/utils/cx";
import columbusLogo from "@/assets/columbus-logo.png";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";

const FAVICON_URL = "https://www.columbus-clean.com/wp-content/uploads/2025/09/columbus-favicon-c-3.png";

type IconType = typeof Users01;

type NavItem = {
  label: string;
  icon: IconType;
  href: string;
  locked?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid01, href: "#/dashboard" },
  { label: "Meta Leads", icon: Users01, href: "#/leads" },
  { label: "Email Campaigns", icon: Mail01, href: "#/email-campaigns" },
  { label: "Campaigns", icon: Announcement01, href: "#/campaigns", locked: true },
  { label: "Audience", icon: Target01, href: "#/audience", locked: true },
  { label: "Analytics", icon: BarChart01, href: "#/analytics", locked: true },
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

      {item.locked && !collapsed && (
        <Lock01 className="ml-auto size-3.5 text-brand" />
      )}

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
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const hash = window.location.hash.replace("#", "") || "/leads";

  const handleSignOut = useCallback(() => {
    // Perform sign out logic here
    window.location.reload();
  }, []);

  return (
    <>
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

        <div className="shrink-0 border-t border-secondary p-3 flex flex-col gap-1">
          <NavLink
            item={{ label: "Settings", icon: Settings01, href: "#/settings", locked: true }}
            collapsed={collapsed}
            active={hash === "settings"}
          />

          <button

            onClick={() => setShowSignOutConfirm(true)}

            title={collapsed ? "Sign out" : undefined}
            className={cx(
              "flex items-center gap-3 rounded-xl text-sm font-medium text-tertiary transition-all duration-200 hover:bg-utility-red-50 hover:text-utility-red-700",
              collapsed ? "h-11 w-11 justify-center" : "h-11 w-full px-3",
            )}
          >
            <LogOut01 className="size-5 shrink-0" strokeWidth={2} />
            {!collapsed && <span>Sign out</span>}
          </button>

          <div className="mt-1 pt-2 border-t border-secondary">
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
        </div>
      </aside>

      <ModalOverlay isOpen={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <Modal>
          <Dialog className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-utility-red-50 ring-8 ring-utility-red-50/50 mb-4">
                <LogOut01 className="size-6 text-utility-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-primary">Confirm Sign Out</h3>
              <p className="text-sm text-tertiary mt-2">
                Are you sure you want to log out? Any unsaved changes might be lost.
              </p>
              <div className="flex items-center gap-3 mt-8 w-full">
                <Button
                  className="flex-1"
                  color="secondary"
                  onClick={() => setShowSignOutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  color="error"
                  onClick={handleSignOut}
                >
                  Yes, Sign out
                </Button>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}
