"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Icon from "@/components/social/Icon";
import SocialLayout from "@/components/social/SocialLayout";

import {
  createGuestSession,
  getGuestSession,
  type GuestSession,
} from "@/lib/guest/session";

type NotificationTab =
  | "all"
  | "mentions";

type NotificationType =
  | "like"
  | "reply"
  | "repost"
  | "follow";

type NotificationItem = {
  id: string;
  type: NotificationType;
  actor_name: string;
  actor_handle: string;
  body?: string | null;
  created_at: string;
  post_id?: string | null;
};

export default function NotificationsPage() {
  const [guest, setGuest] =
    useState<GuestSession | null>(null);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [tab, setTab] =
    useState<NotificationTab>("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const initialized =
    useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);
      setError("");

      let session =
        await getGuestSession();

      if (!session) {
        session =
          await createGuestSession();
      }

      setGuest(session);

      /*
       * Notifications API will be connected
       * after the notifications table schema
       * is confirmed.
       */
      setNotifications([]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();

    const seconds = Math.floor(
      (now.getTime() -
        date.getTime()) /
        1000
    );

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(
      seconds / 60
    );

    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days}d`;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );
  }

  function getIconName(
    type: NotificationType
  ) {
    if (type === "like") {
      return "heart";
    }

    if (type === "reply") {
      return "reply";
    }

    if (type === "repost") {
      return "repost";
    }

    return "user";
  }

  function getActionText(
    type: NotificationType
  ) {
    if (type === "like") {
      return "liked your post";
    }

    if (type === "reply") {
      return "replied to your post";
    }

    if (type === "repost") {
      return "reposted your post";
    }

    return "followed you";
  }

  const visibleNotifications =
    tab === "mentions"
      ? notifications.filter(
          (notification) =>
            notification.type ===
            "reply"
        )
      : notifications;

  return (
    <SocialLayout
      guestHandle={
        guest?.guest_handle
      }
      active="notifications"
    >
      <section className="feed">
        <header className="feed-header">
          <div>
            <h1>Notifications</h1>

            <span>
              See what's happening
            </span>
          </div>

          <button
            className="header-more"
            type="button"
            aria-label="More"
          >
            <Icon
              name="more"
              size={20}
            />
          </button>
        </header>

        {error && (
          <div className="error-banner">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Dismiss"
            >
              <Icon
                name="close"
                size={18}
              />
            </button>
          </div>
        )}

        <div className="notification-tabs">
          <button
            type="button"
            className={
              tab === "all"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              setTab("all")
            }
          >
            All
          </button>

          <button
            type="button"
            className={
              tab === "mentions"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              setTab("mentions")
            }
          >
            Mentions
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />

            <span>
              Loading Notifications...
            </span>
          </div>
        ) : visibleNotifications.length ===
          0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon
                name="bell"
                size={30}
              />
            </div>

            <h2>
              Nothing to see here — yet
            </h2>

            <p>
              When people interact with
              you, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="notification-list">
            {visibleNotifications.map(
              (notification) => (
                <article
                  className="notification-row"
                  key={notification.id}
                >
                  <div className="notification-icon">
                    <Icon
                      name={getIconName(
                        notification.type
                      )}
                      size={22}
                    />
                  </div>

                  <div className="avatar">
                    {notification.actor_handle
                      ?.charAt(0)
                      .toUpperCase() ||
                      "Y"}
                  </div>

                  <div className="notification-content">
                    <div className="notification-line">
                      <strong>
                        {
                          notification.actor_name
                        }
                      </strong>

                      <span>
                        @
                        {
                          notification.actor_handle
                        }
                      </span>

                      <time>
                        {formatDate(
                          notification.created_at
                        )}
                      </time>
                    </div>

                    <p>
                      {getActionText(
                        notification.type
                      )}
                    </p>

                    {notification.body && (
                      <div className="notification-body">
                        {notification.body}
                      </div>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <aside className="right-sidebar">
        <div className="search-box">
          <Icon
            name="search"
            size={19}
          />

          <input
            placeholder="Search YourView"
          />
        </div>

        <section className="side-card">
          <h2>
            What's happening
          </h2>

          <div className="trend">
            <span>Trending</span>

            <strong>
              YourView
            </strong>

            <small>
              Latest conversations
            </small>
          </div>

          <div className="trend">
            <span>Trending</span>

            <strong>
              Community
            </strong>

            <small>
              See what people are saying
            </small>
          </div>

          <button
            className="show-more"
            type="button"
          >
            Show more
          </button>
        </section>

        <section className="side-card">
          <h2>
            Who to follow
          </h2>

          <div className="follow-row">
            <div className="avatar small">
              Y
            </div>

            <div>
              <strong>
                YourView
              </strong>

              <span>
                @yourview
              </span>
            </div>

            <button
              className="follow-button"
              type="button"
            >
              Follow
            </button>
          </div>
        </section>
      </aside>

      <style jsx>{`
        .notification-tabs {
          display: flex;
          height: 50px;
          border-bottom: 1px solid #2f3336;
        }

        .tab {
          flex: 1;
          border: 0;
          background: transparent;
          color: #71767b;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          position: relative;
        }

        .tab:hover {
          background: #181818;
          color: #e7e9ea;
        }

        .tab.active {
          color: #e7e9ea;
          font-weight: 800;
        }

        .tab.active::after {
          content: "";
          position: absolute;
          left: 25%;
          right: 25%;
          bottom: 0;
          height: 3px;
          border-radius: 999px;
          background: #1d9bf0;
        }

        .notification-list {
          width: 100%;
        }

        .notification-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 15px 18px;
          border-bottom: 1px solid #2f3336;
        }

        .notification-row:hover {
          background: rgba(
            255,
            255,
            255,
            0.025
          );
        }

        .notification-icon {
          width: 28px;
          min-width: 28px;
          padding-top: 8px;
          display: flex;
          justify-content: center;
          color: #1d9bf0;
        }

        .notification-content {
          min-width: 0;
          flex: 1;
        }

        .notification-line {
          display: flex;
          align-items: baseline;
          gap: 6px;
          min-width: 0;
        }

        .notification-line strong {
          color: #e7e9ea;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notification-line span {
          color: #71767b;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notification-line time {
          margin-left: auto;
          color: #71767b;
          font-size: 12px;
          white-space: nowrap;
        }

        .notification-content p {
          margin: 3px 0 0;
          color: #e7e9ea;
          font-size: 14px;
          line-height: 20px;
        }

        .notification-body {
          margin-top: 6px;
          color: #71767b;
          font-size: 13px;
          line-height: 19px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 700px) {
          .notification-row {
            gap: 8px;
            padding: 14px 16px;
          }

          .notification-icon {
            width: 24px;
            min-width: 24px;
          }

          .notification-line {
            flex-wrap: wrap;
          }

          .notification-line time {
            margin-left: 0;
          }
        }
      `}</style>
    </SocialLayout>
  );
}