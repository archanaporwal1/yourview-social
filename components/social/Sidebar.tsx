"use client";

import Link from "next/link";
import Icon from "@/components/social/Icon";

type SidebarProps = {
  guestHandle?: string | null;
  guestId?: string | null;
  userId?: string | null;
  active?: string;
};

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon:
    | "home"
    | "search"
    | "bell"
    | "mail"
    | "bookmark"
    | "user"
    | "settings";
};

export default function Sidebar({
  guestHandle,
  guestId,
  userId,
  active,
}: SidebarProps) {
  const profileHref = guestId
    ? `/profile?guest=${encodeURIComponent(guestId)}`
    : userId
      ? `/profile?user=${encodeURIComponent(userId)}`
      : guestHandle
        ? `/profile?guest=${encodeURIComponent(guestHandle)}`
        : "/profile";

  const navItems: NavItem[] = [
    {
      key: "home",
      label: "Home",
      href: "/guest",
      icon: "home",
    },
    {
      key: "explore",
      label: "Explore",
      href: "/explore",
      icon: "search",
    },
    {
      key: "notifications",
      label: "Notifications",
      href: "/notifications",
      icon: "bell",
    },
    {
      key: "messages",
      label: "Messages",
      href: "/messages",
      icon: "mail",
    },
    {
      key: "bookmarks",
      label: "Bookmarks",
      href: "/bookmarks",
      icon: "bookmark",
    },
    {
      key: "profile",
      label: "Profile",
      href: profileHref,
      icon: "user",
    },
    {
      key: "settings",
      label: "Settings",
      href: "/settings",
      icon: "settings",
    },
  ];

  const accountName = guestHandle || "YourView User";

  const accountHandle = guestHandle
    ? `@${guestHandle}`
    : "@yourview";

  const accountLetter = guestHandle
    ? guestHandle.charAt(0).toUpperCase()
    : "Y";

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        {/* BRAND */}
        <Link
          href="/guest"
          className="sidebar-brand"
          aria-label="YourView Home"
        >
          <span className="brand-mark">Y</span>

          <span className="brand-text">
            YourView
          </span>
        </Link>

        {/* NAVIGATION */}
        <nav
          className="sidebar-nav"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = active === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`sidebar-nav-item ${
                  isActive
                    ? "sidebar-nav-item-active"
                    : ""
                }`}
                aria-current={
                  isActive ? "page" : undefined
                }
              >
                <span className="sidebar-icon">
                  <Icon
                    name={item.icon}
                    size={26}
                  />
                </span>

                <span className="sidebar-label">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* POST */}
        <Link
          href="/guest"
          className="sidebar-post-button"
        >
          <span className="sidebar-post-full">
            Post
          </span>

          <span className="sidebar-post-short">
            +
          </span>
        </Link>

        {/* ACCOUNT */}
        <div className="sidebar-account">
          <div className="sidebar-account-avatar">
            {accountLetter}
          </div>

          <div className="sidebar-account-info">
            <div className="sidebar-account-name">
              {accountName}
            </div>

            <div className="sidebar-account-handle">
              {accountHandle}
            </div>
          </div>

          <div className="sidebar-account-more">
            •••
          </div>
        </div>
      </div>

      <style jsx>{`
        /* =========================================
           SIDEBAR
        ========================================= */

        .sidebar {
          width: 250px;
          min-width: 250px;
          height: 100vh;

          position: sticky;
          top: 0;
          align-self: start;

          z-index: 10000;
          pointer-events: auto;
        }

        .sidebar-inner {
          width: 100%;
          height: 100vh;

          display: flex;
          flex-direction: column;

          padding: 6px 18px 12px 4px;

          box-sizing: border-box;
        }

        /* =========================================
           BRAND
        ========================================= */

        .sidebar-brand {
          width: fit-content;
          height: 52px;

          padding: 0 14px;

          display: flex;
          align-items: center;

          gap: 10px;

          border-radius: 999px;

          color: #e7e9ea;
          text-decoration: none;

          transition:
            background 0.15s ease,
            transform 0.1s ease;
        }

        .sidebar-brand:hover {
          background: rgba(231, 233, 234, 0.08);
        }

        .sidebar-brand:active {
          transform: scale(0.98);
        }

        .brand-mark {
          width: 30px;
          height: 30px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #e7e9ea;
          color: #000;

          font-size: 18px;
          font-weight: 800;

          line-height: 1;
        }

        .brand-text {
          font-size: 20px;
          font-weight: 700;

          letter-spacing: -0.4px;
          line-height: 1;
        }

        /* =========================================
           NAVIGATION
        ========================================= */

        .sidebar-nav {
          width: 100%;

          display: flex;
          flex-direction: column;

          gap: 2px;

          margin-top: 6px;
        }

        .sidebar-nav-item {
          width: 100%;
          max-width: 218px;
          height: 52px;

          padding: 0 16px;

          display: flex;
          align-items: center;

          gap: 18px;

          box-sizing: border-box;

          border-radius: 999px;

          color: #e7e9ea;
          text-decoration: none;

          font-size: 18px;
          font-weight: 400;

          line-height: 1;

          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .sidebar-nav-item:hover {
          background: rgba(231, 233, 234, 0.1);
        }

        .sidebar-nav-item-active {
          font-weight: 700;
        }

        .sidebar-icon {
          width: 28px;
          height: 28px;

          flex: 0 0 28px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-label {
          white-space: nowrap;
        }

        /* =========================================
           POST BUTTON
        ========================================= */

        .sidebar-post-button {
          width: 218px;
          height: 52px;

          margin-top: 16px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 999px;

          background: #1d9bf0;
          color: #fff;

          text-decoration: none;

          font-size: 17px;
          font-weight: 700;

          transition:
            background 0.15s ease,
            transform 0.1s ease;
        }

        .sidebar-post-button:hover {
          background: #1a8cd8;
        }

        .sidebar-post-button:active {
          transform: scale(0.98);
        }

        .sidebar-post-short {
          display: none;
        }

        /* =========================================
           ACCOUNT
        ========================================= */

        .sidebar-account {
          width: 218px;
          min-height: 60px;

          margin-top: auto;
          padding: 8px 10px;

          display: flex;
          align-items: center;

          gap: 10px;

          box-sizing: border-box;

          border-radius: 999px;

          color: #e7e9ea;

          transition:
            background 0.15s ease;
        }

        .sidebar-account:hover {
          background: rgba(231, 233, 234, 0.1);
        }

        .sidebar-account-avatar {
          width: 40px;
          height: 40px;

          flex: 0 0 40px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #2f3336;
          color: #e7e9ea;

          font-size: 16px;
          font-weight: 700;
        }

        .sidebar-account-info {
          min-width: 0;
          flex: 1;
        }

        .sidebar-account-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: #e7e9ea;

          font-size: 14px;
          font-weight: 700;

          line-height: 19px;
        }

        .sidebar-account-handle {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: #71767b;

          font-size: 14px;

          line-height: 18px;
        }

        .sidebar-account-more {
          flex: 0 0 auto;

          color: #e7e9ea;

          font-size: 14px;
          font-weight: 700;

          letter-spacing: 1px;
        }

        /* =========================================
           TABLET
        ========================================= */

        @media (max-width: 1100px) {
          .sidebar {
            width: 88px;
            min-width: 88px;
          }

          .sidebar-inner {
            padding: 6px 10px 12px;

            align-items: center;
          }

          .sidebar-brand {
            width: 52px;
            height: 52px;

            padding: 0;

            justify-content: center;
          }

          .brand-text {
            display: none;
          }

          .sidebar-nav {
            width: auto;

            align-items: center;
          }

          .sidebar-nav-item {
            width: 52px;
            min-width: 52px;
            max-width: 52px;

            height: 52px;

            padding: 0;

            justify-content: center;

            gap: 0;
          }

          .sidebar-label {
            display: none;
          }

          .sidebar-post-button {
            width: 52px;
            height: 52px;

            padding: 0;

            margin-top: 16px;
          }

          .sidebar-post-full {
            display: none;
          }

          .sidebar-post-short {
            display: block;

            font-size: 28px;
            font-weight: 400;

            line-height: 1;
          }

          .sidebar-account {
            width: 52px;
            min-height: 52px;
            height: 52px;

            padding: 6px;

            justify-content: center;
          }

          .sidebar-account-info,
          .sidebar-account-more {
            display: none;
          }

          .sidebar-account-avatar {
            width: 40px;
            height: 40px;
          }
        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 700px) {
          .sidebar {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}