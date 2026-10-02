"use client";

import Link from "next/link";
import Icon from "@/components/social/Icon";

type MobileNavProps = {
  active?: string;
};

type MobileNavItem = {
  key: string;
  label: string;
  href: string;
  icon:
    | "home"
    | "search"
    | "bell"
    | "mail"
    | "bookmark"
    | "user";
};

export default function MobileNav({
  active,
}: MobileNavProps) {
  const items: MobileNavItem[] = [
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
      href: "/profile",
      icon: "user",
    },
  ];

  return (
    <nav
      className="mobile-nav"
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`mobile-nav-item ${
              isActive ? "mobile-nav-item-active" : ""
            }`}
            aria-label={item.label}
            aria-current={
              isActive ? "page" : undefined
            }
          >
            <Icon name={item.icon} size={24} />
          </Link>
        );
      })}

      <style jsx>{`
        .mobile-nav {
          display: none;
        }

        @media (max-width: 700px) {
          .mobile-nav {
            position: fixed;
            z-index: 10000;
            left: 0;
            right: 0;
            bottom: 0;
            height: 58px;
            display: flex;
            align-items: center;
            justify-content: space-around;
            background: rgba(0, 0, 0, 0.96);
            border-top: 1px solid #2f3336;
            padding: 0 8px;
            box-sizing: border-box;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }

          .mobile-nav-item {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            color: #71767b;
            text-decoration: none;
            transition:
              background 0.15s ease,
              color 0.15s ease;
          }

          .mobile-nav-item:hover {
            background: rgba(231, 233, 234, 0.1);
            color: #e7e9ea;
          }

          .mobile-nav-item-active {
            color: #e7e9ea;
          }

          .mobile-nav-item:active {
            transform: scale(0.94);
          }
        }
      `}</style>
    </nav>
  );
}