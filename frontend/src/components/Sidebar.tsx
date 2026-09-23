"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

interface SidebarProps {
  collapsed?: boolean;
  onCollapseChange?: (
    collapsed: boolean
  ) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  showUser?: boolean;
  className?: string;
}

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

/*
 * SVG icon helper.
 */
function Icon({
  children,
  size = 20,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/*
 * Sidebar navigation.
 */
const sidebarSections: SidebarSection[] = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
          <Icon>
            <rect
              x="3"
              y="3"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <rect
              x="14"
              y="3"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <rect
              x="3"
              y="14"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <rect
              x="14"
              y="14"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </Icon>
        ),
      },
      {
        label: "Create Audiobook",
        href: "/create",
        icon: (
          <Icon>
            <path
              d="M12 3v18M3 12h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Icon>
        ),
      },
      {
        label: "Library",
        href: "/library",
        icon: (
          <Icon>
            <path
              d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17.5A2.5 2.5 0 0 0 17.5 17H5V4.5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M5 17v2.5A2.5 2.5 0 0 0 7.5 22H19"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M9 6h7M9 10h6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </Icon>
        ),
      },
      {
        label: "Player",
        href: "/player",
        icon: (
          <Icon>
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <path
              d="m10 8.8 5.1 3.2-5.1 3.2V8.8Z"
              fill="currentColor"
            />
          </Icon>
        ),
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        label: "Pricing",
        href: "/pricing",
        icon: (
          <Icon>
            <path
              d="M12 3 4 7.5l8 4.5 8-4.5L12 3Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </Icon>
        ),
      },
      {
        label: "Settings",
        href: "/settings",
        icon: (
          <Icon>
            <path
              d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <path
              d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-1.9 1.9-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V22h-2.68v-.08a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.06.06-1.9-1.9.06-.06A1.8 1.8 0 0 0 7.48 15a1.8 1.8 0 0 0-1.66-1.1H5.74v-2.68h.08A1.8 1.8 0 0 0 7.48 10a1.8 1.8 0 0 0-.36-1.98l-.06-.06 1.9-1.9.06.06A1.8 1.8 0 0 0 11 6.48a1.8 1.8 0 0 0 1.1-1.66v-.08h2.68v.08A1.8 1.8 0 0 0 15.9 6.48a1.8 1.8 0 0 0 1.98-.36l.06-.06 1.9 1.9-.06.06A1.8 1.8 0 0 0 19.42 10a1.8 1.8 0 0 0 1.66 1.1h.08v2.68h-.08A1.8 1.8 0 0 0 19.4 15Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </Icon>
        ),
      },
    ],
  },
];

const defaultUser = {
  name: "RAFTA User",
  email: "Welcome to RAFTA AI",
};

export default function Sidebar({
  collapsed: controlledCollapsed,
  onCollapseChange,
  mobileOpen = false,
  onMobileClose,
  showUser = true,
  className = "",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [internalCollapsed, setInternalCollapsed] =
    useState(false);

  const [user, setUser] =
    useState(defaultUser);

  const [mounted, setMounted] =
    useState(false);

  const [logoutOpen, setLogoutOpen] =
    useState(false);

  const collapsed =
    controlledCollapsed ??
    internalCollapsed;

  useEffect(() => {
    setMounted(true);

    try {
      const possibleName =
        localStorage.getItem(
          "rafta_user_name"
        );

      const possibleEmail =
        localStorage.getItem(
          "rafta_user_email"
        );

      const sessionUser =
        sessionStorage.getItem(
          "rafta_user"
        );

      if (
        possibleName ||
        possibleEmail
      ) {
        setUser({
          name:
            possibleName ||
            defaultUser.name,
          email:
            possibleEmail ||
            defaultUser.email,
        });
        return;
      }

      if (sessionUser) {
        try {
          const parsed =
            JSON.parse(sessionUser);

          setUser({
            name:
              typeof parsed?.name ===
              "string"
                ? parsed.name
                : defaultUser.name,
            email:
              typeof parsed?.email ===
              "string"
                ? parsed.email
                : defaultUser.email,
          });
        } catch {
          // Ignore invalid session data.
        }
      }
    } catch (error) {
      console.error(
        "Could not load sidebar user:",
        error
      );
    }
  }, []);

  /*
   * Close mobile sidebar when route changes.
   */
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]);

  /*
   * Close logout confirmation with Escape.
   */
  useEffect(() => {
    if (!logoutOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setLogoutOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [logoutOpen]);

  const setCollapsed = (
    nextValue: boolean
  ) => {
    setInternalCollapsed(nextValue);
    onCollapseChange?.(nextValue);
  };

  const isActive = (
    href: string
  ) => {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const getInitials = () => {
    const name =
      user.name.trim();

    if (!name) {
      return "R";
    }

    const parts =
      name.split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`
      .toUpperCase();
  };

  const handleLogout = () => {
    try {
      /*
       * Remove common local/session authentication
       * values used by the RAFTA frontend.
       */
      localStorage.removeItem(
        "rafta_user"
      );

      localStorage.removeItem(
        "rafta_user_name"
      );

      localStorage.removeItem(
        "rafta_user_email"
      );

      localStorage.removeItem(
        "rafta_token"
      );

      localStorage.removeItem(
        "rafta_auth_token"
      );

      sessionStorage.removeItem(
        "rafta_user"
      );

      sessionStorage.removeItem(
        "rafta_token"
      );

      sessionStorage.removeItem(
        "rafta_auth_token"
      );
    } catch (error) {
      console.error(
        "Logout cleanup error:",
        error
      );
    }

    setLogoutOpen(false);
    onMobileClose?.();

    router.push("/login");
  };

  const sidebarClasses = [
    "rafta-sidebar",
    collapsed
      ? "rafta-sidebar-collapsed"
      : "",
    mobileOpen
      ? "rafta-sidebar-mobile-open"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <aside
        className={sidebarClasses}
        aria-label="Main sidebar navigation"
      >
        <div className="rafta-sidebar-inner">

          {/* -------------------------------------------------
              Logo
          -------------------------------------------------- */}

          <div className="rafta-sidebar-header">
            <Link
              href="/dashboard"
              className="rafta-sidebar-logo"
              onClick={() =>
                onMobileClose?.()
              }
            >
              <span className="rafta-sidebar-logo-mark">
                R
              </span>

              {!collapsed && (
                <span className="rafta-sidebar-logo-text">
                  RAFTA{" "}
                  <strong>AI</strong>
                </span>
              )}
            </Link>

            <button
              type="button"
              className="rafta-sidebar-collapse"
              onClick={() =>
                setCollapsed(
                  !collapsed
                )
              }
              aria-label={
                collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              title={
                collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              <span
                className={
                  collapsed
                    ? "rafta-sidebar-arrow-collapsed"
                    : ""
                }
              >
                ‹
              </span>
            </button>
          </div>

          {/* -------------------------------------------------
              Create Button
          -------------------------------------------------- */}

          <div className="rafta-sidebar-create-wrapper">
            <Link
              href="/create"
              className="rafta-sidebar-create"
              onClick={() =>
                onMobileClose?.()
              }
              title={
                collapsed
                  ? "Create Audiobook"
                  : undefined
              }
            >
              <span className="rafta-sidebar-create-icon">
                +
              </span>

              {!collapsed && (
                <span>
                  Create Audiobook
                </span>
              )}
            </Link>
          </div>

          {/* -------------------------------------------------
              Navigation
          -------------------------------------------------- */}

          <div className="rafta-sidebar-navigation">
            {sidebarSections.map(
              (section) => (
                <div
                  key={section.title}
                  className="rafta-sidebar-section"
                >
                  {!collapsed && (
                    <div className="rafta-sidebar-section-title">
                      {section.title}
                    </div>
                  )}

                  {collapsed && (
                    <div className="rafta-sidebar-section-line" />
                  )}

                  <nav
                    className="rafta-sidebar-nav"
                    aria-label={
                      section.title
                    }
                  >
                    {section.items.map(
                      (item) => {
                        const active =
                          isActive(
                            item.href
                          );

                        return (
                          <Link
                            key={
                              item.href
                            }
                            href={
                              item.href
                            }
                            className={[
                              "rafta-sidebar-item",
                              active
                                ? "active"
                                : "",
                            ]
                              .filter(
                                Boolean
                              )
                              .join(" ")}
                            onClick={() =>
                              onMobileClose?.()
                            }
                            title={
                              collapsed
                                ? item.label
                                : undefined
                            }
                            aria-current={
                              active
                                ? "page"
                                : undefined
                            }
                          >
                            <span className="rafta-sidebar-item-icon">
                              {item.icon}
                            </span>

                            {!collapsed && (
                              <span className="rafta-sidebar-item-label">
                                {
                                  item.label
                                }
                              </span>
                            )}

                            {!collapsed &&
                              item.badge !==
                                undefined && (
                                <span className="rafta-sidebar-item-badge">
                                  {
                                    item.badge
                                  }
                                </span>
                              )}

                            {active && (
                              <span className="rafta-sidebar-active-indicator" />
                            )}
                          </Link>
                        );
                      }
                    )}
                  </nav>
                </div>
              )
            )}
          </div>

          {/* -------------------------------------------------
              Bottom area
          -------------------------------------------------- */}

          <div className="rafta-sidebar-bottom">
            {!collapsed && (
              <Link
                href="/create"
                className="rafta-sidebar-upgrade"
                onClick={() =>
                  onMobileClose?.()
                }
              >
                <div className="rafta-sidebar-upgrade-icon">
                  ✦
                </div>

                <div className="rafta-sidebar-upgrade-content">
                  <strong>
                    Create more
                  </strong>

                  <span>
                    Turn your text into
                    audio
                  </span>
                </div>

                <span className="rafta-sidebar-upgrade-arrow">
                  →
                </span>
              </Link>
            )}

            {showUser && (
              <div className="rafta-sidebar-user">
                <div className="rafta-sidebar-user-avatar">
                  {mounted
                    ? getInitials()
                    : "R"}
                </div>

                {!collapsed && (
                  <div className="rafta-sidebar-user-info">
                    <strong>
                      {mounted
                        ? user.name
                        : defaultUser.name}
                    </strong>

                    <span>
                      {mounted
                        ? user.email
                        : defaultUser.email}
                    </span>
                  </div>
                )}

                {!collapsed && (
                  <button
                    type="button"
                    className="rafta-sidebar-user-menu"
                    onClick={() =>
                      setLogoutOpen(
                        true
                      )
                    }
                    aria-label="Open account menu"
                    title="Account menu"
                  >
                    ⋮
                  </button>
                )}

                {collapsed && (
                  <button
                    type="button"
                    className="rafta-sidebar-collapsed-logout"
                    onClick={() =>
                      setLogoutOpen(
                        true
                      )
                    }
                    aria-label="Log out"
                    title="Log out"
                  >
                    ⇥
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------
          Mobile overlay
      -------------------------------------------------- */}

      {mobileOpen && (
        <button
          type="button"
          className="rafta-sidebar-mobile-overlay"
          onClick={() =>
            onMobileClose?.()
          }
          aria-label="Close sidebar"
        />
      )}

      {/* -------------------------------------------------
          Logout modal
      -------------------------------------------------- */}

      {logoutOpen && (
        <div
          className="rafta-sidebar-logout-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setLogoutOpen(false);
            }
          }}
          role="presentation"
        >
          <div
            className="rafta-sidebar-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rafta-sidebar-logout-title"
          >
            <div className="rafta-sidebar-logout-icon">
              ⇥
            </div>

            <h2 id="rafta-sidebar-logout-title">
              Log out?
            </h2>

            <p>
              Are you sure you want to log
              out of your RAFTA AI account?
            </p>

            <div className="rafta-sidebar-logout-actions">
              <button
                type="button"
                className="rafta-sidebar-logout-cancel"
                onClick={() =>
                  setLogoutOpen(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="rafta-sidebar-logout-confirm"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/*
 * Mobile sidebar trigger.
 *
 * Use this in pages with a mobile layout.
 */
export function SidebarMenuButton({
  onClick,
  open = false,
}: {
  onClick: () => void;
  open?: boolean;
}) {
  return (
    <button
      type="button"
      className={`rafta-sidebar-menu-trigger ${
        open ? "open" : ""
      }`}
      onClick={onClick}
      aria-label={
        open
          ? "Close navigation"
          : "Open navigation"
      }
      aria-expanded={open}
    >
      <span />
      <span />
      <span />
    </button>
  );
}

/*
 * Simple desktop/mobile sidebar layout helper.
 */
export function SidebarLayout({
  children,
  sidebar,
  mobileHeader,
  className = "",
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  mobileHeader?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rafta-sidebar-layout ${className}`.trim()}
    >
      {sidebar}

      <div className="rafta-sidebar-page">
        {mobileHeader}

        <main className="rafta-sidebar-main">
          {children}
        </main>
      </div>
    </div>
  );
}