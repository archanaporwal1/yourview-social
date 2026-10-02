import { ReactNode } from "react";

import Sidebar from "@/components/social/Sidebar";
import MobileNav from "@/components/social/MobileNav";

type SocialLayoutProps = {
  children: ReactNode;
  guestHandle?: string | null;
  guestId?: string | null;
  userId?: string | null;
  active?: string;
};

export default function SocialLayout({
  children,
  guestHandle,
  guestId,
  userId,
  active,
}: SocialLayoutProps) {
  return (
    <main className="social-app-shell">
      <div className="social-layout">
        <Sidebar
          guestHandle={guestHandle}
          guestId={guestId}
          userId={userId}
          active={active}
        />

        {children}

        <MobileNav active={active} />
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #000;
          color: #e7e9ea;
        }

        body {
          min-height: 100vh;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Helvetica,
            Arial,
            sans-serif;
        }

        a {
          color: inherit;
        }

        button,
        input,
        textarea {
          font: inherit;
        }

        .social-app-shell {
          width: 100%;
          min-height: 100vh;
          background: #000;
          color: #e7e9ea;
        }

        .social-layout {
          width: 100%;
          max-width: 1320px;
          min-height: 100vh;
          margin: 0 auto;
          display: grid;
          grid-template-columns:
            250px
            minmax(0, 650px)
            350px;
          align-items: start;
          position: relative;
          isolation: isolate;
        }

        /*
         * Shared column rules.
         * Pages using SocialLayout should place:
         *
         *   <section className="feed">...</section>
         *   <aside className="right-sidebar">...</aside>
         */

        .social-layout > .sidebar {
          grid-column: 1;
          grid-row: 1;
          position: sticky;
          top: 0;
          z-index: 10000;
          pointer-events: auto;
        }

        .social-layout > .feed {
          grid-column: 2;
          grid-row: 1;
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .social-layout > .right-sidebar {
          grid-column: 3;
          grid-row: 1;
          min-width: 0;
          position: relative;
          z-index: 2;
        }

        /*
         * Shared feed
         */

        .feed {
          width: 100%;
          min-width: 0;
          border-left: 1px solid #2f3336;
          border-right: 1px solid #2f3336;
          min-height: 100vh;
          background: #000;
        }

        /*
         * Shared feed header
         */

        .feed-header {
          height: 64px;
          min-height: 64px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #2f3336;
          background: rgba(0, 0, 0, 0.92);
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .feed-header h1,
        .feed-header h2 {
          margin: 0;
          font-size: 20px;
          line-height: 24px;
          font-weight: 700;
          color: #e7e9ea;
        }

        /*
         * Shared right sidebar
         */

        .right-sidebar {
          padding: 12px 20px 20px 20px;
        }

        /*
         * Shared sidebar cards
         */

        .side-card {
          width: 100%;
          background: #16181c;
          border-radius: 16px;
          overflow: hidden;
        }

        /*
         * Shared avatar
         */

        .avatar {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 50%;
          background: #2f3336;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e7e9ea;
          font-size: 16px;
          font-weight: 700;
        }

        /*
         * Shared primary button
         */

        .follow-button {
          min-height: 36px;
          padding: 0 16px;
          border: 0;
          border-radius: 999px;
          background: #e7e9ea;
          color: #000;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition:
            background 0.15s ease,
            opacity 0.15s ease;
        }

        .follow-button:hover {
          background: #d7dbdc;
        }

        .follow-button:disabled {
          cursor: default;
          opacity: 0.55;
        }

        /*
         * Shared error state
         */

        .error-banner {
          margin: 12px 16px;
          padding: 12px 14px;
          border: 1px solid #5b2626;
          border-radius: 12px;
          background: #210f0f;
          color: #f3a6a6;
          font-size: 14px;
          line-height: 20px;
        }

        /*
         * Shared loading state
         */

        .loading-state {
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #71767b;
          font-size: 15px;
        }

        .spinner {
          width: 22px;
          height: 22px;
          border: 2px solid #2f3336;
          border-top-color: #1d9bf0;
          border-radius: 50%;
          animation: yourview-spin 0.8s linear infinite;
        }

        @keyframes yourview-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /*
         * Shared empty state
         */

        .empty-state {
          padding: 60px 24px;
          text-align: center;
          color: #71767b;
        }

        .empty-state strong {
          display: block;
          margin-bottom: 6px;
          color: #e7e9ea;
          font-size: 20px;
          line-height: 26px;
        }

        .empty-state p {
          margin: 0;
          font-size: 15px;
          line-height: 21px;
        }

        /*
         * Shared scrollbar
         */

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #000;
        }

        ::-webkit-scrollbar-thumb {
          background: #2f3336;
          border-radius: 999px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555b60;
        }

        /*
         * Tablet
         */

        @media (max-width: 1100px) {
          .social-layout {
            grid-template-columns:
              88px
              minmax(0, 650px)
              300px;
          }

          .right-sidebar {
            padding-left: 14px;
            padding-right: 14px;
          }
        }

        /*
         * Mobile
         */

        @media (max-width: 700px) {
          .social-layout {
            display: block;
            width: 100%;
            max-width: none;
            min-height: 100vh;
            padding-bottom: 58px;
          }

          .social-layout > .sidebar {
            display: none;
          }

          .social-layout > .feed {
            width: 100%;
            min-height: calc(100vh - 58px);
            border-left: 0;
            border-right: 0;
          }

          .social-layout > .right-sidebar {
            display: none;
          }

          .feed-header {
            height: 58px;
            min-height: 58px;
            padding: 0 16px;
          }

          .feed-header h1,
          .feed-header h2 {
            font-size: 19px;
          }

          .right-sidebar {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}