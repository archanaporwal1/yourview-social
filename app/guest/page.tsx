"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";

import {
  createGuestSession,
  getGuestSession,
  type GuestSession,
} from "@/lib/guest/session";

type Reply = {
  id: string;
  post_id: string;
  user_id: string | null;
  guest_handle: string | null;
  body: string;
  created_at: string;
};

type Post = {
  id: string;
  body: string;
  media_url: string | null;
  guest_handle: string | null;
  guest_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;

  like_count: number;
  repost_count: number;
  bookmark_count: number;

  liked: boolean;
  reposted: boolean;
  bookmarked: boolean;

  replies: Reply[];
  reply_count: number;
};

type ActionType = "like" | "repost" | "bookmark";

type IconName =
  | "home"
  | "search"
  | "bell"
  | "mail"
  | "bookmark"
  | "user"
  | "settings"
  | "reply"
  | "repost"
  | "heart"
  | "share"
  | "edit"
  | "more"
  | "logout"
  | "close";

function Icon({
  name,
  size = 20,
  filled = false,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );

    case "bookmark":
      return (
        <svg {...common}>
          <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V22l-6-4-6 4z" />
        </svg>
      );

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.6-1H6v-2h.8a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L8 9l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V6H15v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.7 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );

    case "reply":
      return (
        <svg {...common}>
          <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 3v-6a7.5 7.5 0 1 1 17-4.5Z" />
        </svg>
      );

    case "repost":
      return (
        <svg {...common}>
          <path d="M17 3l4 4-4 4" />
          <path d="M3 7h18" />
          <path d="M7 21l-4-4 4-4" />
          <path d="M21 17H3" />
        </svg>
      );

    case "heart":
      return (
        <svg {...common}>
          <path d="M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />
        </svg>
      );

    case "share":
      return (
        <svg {...common}>
          <path d="M12 16V3" />
          <path d="m7 8 5-5 5 5" />
          <path d="M5 13v6h14v-6" />
        </svg>
      );

    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      );

    case "more":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1.3" fill="currentColor" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" />
          <circle cx="19" cy="12" r="1.3" fill="currentColor" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 4H5v16h5" />
          <path d="M14 8l4 4-4 4" />
          <path d="M18 12H9" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isEditable(createdAt: string, now: number) {
  if (!now) return false;

  return (
    now - new Date(createdAt).getTime() <
    5 * 60 * 1000
  );
}

export default function GuestPage() {
  const [guest, setGuest] = useState<GuestSession | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);

  const [postText, setPostText] = useState("");

  const [replyText, setReplyText] = useState<
    Record<string, string>
  >({});

  const [replyOpen, setReplyOpen] = useState<
    Record<string, boolean>
  >({});

  const [editingPostId, setEditingPostId] = useState<
    string | null
  >(null);

  const [editingText, setEditingText] = useState("");

  const [loading, setLoading] = useState(true);

  const [posting, setPosting] = useState(false);

  const [replyLoading, setReplyLoading] = useState<
    string | null
  >(null);

  const [actionLoading, setActionLoading] = useState<
    string | null
  >(null);

  const [editLoading, setEditLoading] = useState<
    string | null
  >(null);

  const [error, setError] = useState("");

  const [now, setNow] = useState(0);

  const initialized = useRef(false);

  useEffect(() => {
    setNow(Date.now());

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    initializeGuest();
  }, []);

  async function initializeGuest() {
    try {
      setLoading(true);
      setError("");

      let session = await getGuestSession();

      if (!session) {
        session = await createGuestSession();
      }

      setGuest(session);

      await loadPosts(session);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load YourView."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPosts(
    currentGuest?: GuestSession
  ) {
    const activeGuest = currentGuest || guest;

    if (!activeGuest) return;

    const response = await fetch("/api/posts", {
      method: "GET",
      headers: {
        "x-yourview-guest-id": activeGuest.id,
      },
      cache: "no-store",
    });

    const result = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error ||
          result?.message ||
          "Unable to load posts."
      );
    }

    setPosts(result?.posts || []);
  }

  async function handleCreatePost(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!guest || posting) return;

    if (!postText.trim()) return;

    try {
      setPosting(true);
      setError("");

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-yourview-guest-id": guest.id,
        },
        body: JSON.stringify({
          body: postText,
        }),
      });

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to publish post."
        );
      }

      setPostText("");

      await loadPosts(guest);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish post."
      );
    } finally {
      setPosting(false);
    }
  }

  async function handleReply(
    event: FormEvent<HTMLFormElement>,
    postId: string
  ) {
    event.preventDefault();

    if (!guest || replyLoading) return;

    const text = replyText[postId]?.trim();

    if (!text) {
      setError("Reply text is required.");
      return;
    }

    try {
      setReplyLoading(postId);
      setError("");

      const response = await fetch("/api/posts/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-yourview-guest-id": guest.id,
        },
        body: JSON.stringify({
          post_id: postId,
          body: text,
        }),
      });

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to reply."
        );
      }

      setReplyText((previous) => ({
        ...previous,
        [postId]: "",
      }));

      await loadPosts(guest);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to reply."
      );
    } finally {
      setReplyLoading(null);
    }
  }

  async function handleSocialAction(
    type: ActionType,
    postId: string
  ) {
    if (!guest || actionLoading) return;

    try {
      setActionLoading(`${type}-${postId}`);
      setError("");

      const response = await fetch(
        `/api/posts/${type}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-yourview-guest-id": guest.id,
          },
          body: JSON.stringify({
            post_id: postId,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            `Unable to ${type} post.`
        );
      }

      setPosts((previous) =>
        previous.map((post) => {
          if (post.id !== postId) return post;

          if (type === "like") {
            return {
              ...post,
              liked: Boolean(result?.liked),
              like_count:
                Number(result?.like_count) ||
                0,
            };
          }

          if (type === "repost") {
            return {
              ...post,
              reposted: Boolean(result?.reposted),
              repost_count:
                Number(result?.repost_count) ||
                0,
            };
          }

          return {
            ...post,
            bookmarked: Boolean(result?.bookmarked),
            bookmark_count:
              Number(result?.bookmark_count) ||
              0,
          };
        })
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${type} post.`
      );
    } finally {
      setActionLoading(null);
    }
  }

  function startEditing(post: Post) {
    setEditingPostId(post.id);
    setEditingText(post.body);
    setError("");
  }

  function cancelEditing() {
    setEditingPostId(null);
    setEditingText("");
  }

  async function handleEdit(
    event: FormEvent<HTMLFormElement>,
    postId: string
  ) {
    event.preventDefault();

    if (!guest || editLoading) return;

    if (!editingText.trim()) {
      setError("Post text is required.");
      return;
    }

    try {
      setEditLoading(postId);
      setError("");

      const response = await fetch("/api/posts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-yourview-guest-id": guest.id,
        },
        body: JSON.stringify({
          post_id: postId,
          body: editingText,
        }),
      });

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to edit post."
        );
      }

      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? {
                ...post,
                body:
                  result?.post?.body ??
                  editingText.trim(),
                updated_at:
                  result?.post?.updated_at ??
                  new Date().toISOString(),
              }
            : post
        )
      );

      cancelEditing();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to edit post."
      );
    } finally {
      setEditLoading(null);
    }
  }

  return (
    <main className="app-shell">
      <div className="layout">
        {/* LEFT SIDEBAR */}
        <aside className="left-sidebar">
          <div className="brand">
            <div className="brand-mark">Y</div>
            <span>YourView</span>
          </div>

          <nav className="main-nav">
            <Link
              href="/guest"
              className="nav-item active"
            >
              <Icon name="home" size={25} />
              <span>Home</span>
            </Link>

            <Link
              href="/explore"
              className="nav-item"
            >
              <Icon name="search" size={25} />
              <span>Explore</span>
            </Link>

            <Link
              href="/notifications"
              className="nav-item"
            >
              <Icon name="bell" size={25} />
              <span>Notifications</span>
            </Link>

            <Link
              href="/messages"
              className="nav-item"
            >
              <Icon name="mail" size={25} />
              <span>Messages</span>
            </Link>

            <Link
              href="/bookmarks"
              className="nav-item"
            >
              <Icon name="bookmark" size={25} />
              <span>Bookmarks</span>
            </Link>

            <Link
              href={
                guest?.id
                  ? `/profile?guest=${encodeURIComponent(
                      guest.id
                    )}`
                  : "/profile"
              }
              className="nav-item"
            >
              <Icon name="user" size={25} />
              <span>Profile</span>
            </Link>

            <Link
              href="/settings"
              className="nav-item"
            >
              <Icon name="settings" size={25} />
              <span>Settings</span>
            </Link>
          </nav>

          <button className="post-button">
            Post
          </button>

          <div className="guest-card">
            <div className="avatar small">
              {guest?.guest_handle
                ?.charAt(0)
                .toUpperCase() || "Y"}
            </div>

            <div className="guest-info">
              <strong>
                {guest?.guest_handle || "Guest"}
              </strong>
              <span>
                @{guest?.guest_handle || "guest"}
              </span>
            </div>

            <Icon name="more" size={20} />
          </div>
        </aside>

        {/* MAIN FEED */}
        <section className="feed">
          <header className="feed-header">
            <div>
              <h1>Home</h1>
              <span>Latest posts</span>
            </div>

            <button className="header-more">
              <Icon name="more" size={20} />
            </button>
          </header>

          {error && (
            <div className="error-banner">
              <span>{error}</span>

              <button
                onClick={() => setError("")}
                aria-label="Dismiss"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          )}

          {/* COMPOSER */}
          <form
            className="composer"
            onSubmit={handleCreatePost}
          >
            <div className="avatar">
              {guest?.guest_handle
                ?.charAt(0)
                .toUpperCase() || "Y"}
            </div>

            <div className="composer-main">
              <textarea
                value={postText}
                onChange={(event) =>
                  setPostText(event.target.value)
                }
                placeholder="What is happening?"
                rows={3}
              />

              <div className="composer-bottom">
                <div className="composer-tools">
                  <button
                    type="button"
                    title="Media"
                    disabled
                  >
                    <span className="tool-square">
                      +
                    </span>
                  </button>
                </div>

                <button
                  className="composer-post"
                  type="submit"
                  disabled={
                    posting || !postText.trim()
                  }
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </form>

          {/* POSTS */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Loading your feed...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon name="home" size={30} />
              </div>

              <h2>Welcome to YourView</h2>

              <p>
                Your feed is empty. Be the first to
                share something.
              </p>
            </div>
          ) : (
            <div className="posts">
              {posts.map((post) => {
                const ownPost =
                  Boolean(
                    guest?.id &&
                      post.guest_id === guest.id
                  );

                const editing =
                  editingPostId === post.id;

                const canEdit =
                  ownPost &&
                  isEditable(post.created_at, now);

                return (
                  <article
                    className="post"
                    key={post.id}
                  >
                    <div className="post-avatar">
                      {post.guest_handle
                        ?.charAt(0)
                        .toUpperCase() || "Y"}
                    </div>

                    <div className="post-content">
                      <div className="post-header">
                        <div className="author">
                          <strong>
                            {post.guest_handle ||
                              "YourView User"}
                          </strong>

                          <span>
                            @
                            {post.guest_handle ||
                              "guest"}
                          </span>

                          <span className="dot">
                            ·
                          </span>

                          <span>
                            {formatDate(
                              post.created_at
                            )}
                          </span>

                          {post.updated_at !==
                            post.created_at && (
                            <span className="edited">
                              · edited
                            </span>
                          )}
                        </div>

                        <button className="more-button">
                          <Icon
                            name="more"
                            size={19}
                          />
                        </button>
                      </div>

                      {editing ? (
                        <form
                          className="edit-box"
                          onSubmit={(event) =>
                            handleEdit(
                              event,
                              post.id
                            )
                          }
                        >
                          <textarea
                            value={editingText}
                            onChange={(event) =>
                              setEditingText(
                                event.target.value
                              )
                            }
                            autoFocus
                          />

                          <div className="edit-actions">
                            <button
                              type="button"
                              className="cancel-button"
                              onClick={
                                cancelEditing
                              }
                            >
                              Cancel
                            </button>

                            <button
                              type="submit"
                              className="save-button"
                              disabled={
                                editLoading ===
                                post.id
                              }
                            >
                              {editLoading ===
                              post.id
                                ? "Saving..."
                                : "Save"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="post-body">
                          {post.body}
                        </div>
                      )}

                      {/* ACTION BAR
                          EXACT ORDER:
                          LIKE → REPLY → REPOST → BOOKMARK → EDIT
                      */}
                      <div className="action-bar">
                        {/* LIKE */}
                        <button
                          className={`action like ${
                            post.liked
                              ? "active-like"
                              : ""
                          }`}
                          onClick={() =>
                            handleSocialAction(
                              "like",
                              post.id
                            )
                          }
                          disabled={
                            actionLoading ===
                            `like-${post.id}`
                          }
                          title="Like"
                        >
                          <span className="action-icon">
                            <Icon
                              name="heart"
                              size={19}
                              filled={post.liked}
                            />
                          </span>

                          <span className="count">
                            {post.like_count || ""}
                          </span>
                        </button>

                        {/* REPLY */}
                        <button
                          className={`action reply-action ${
                            replyOpen[post.id]
                              ? "active-reply"
                              : ""
                          }`}
                          onClick={() =>
                            setReplyOpen(
                              (previous) => ({
                                ...previous,
                                [post.id]:
                                  !previous[
                                    post.id
                                  ],
                              })
                            )
                          }
                          title="Reply"
                        >
                          <span className="action-icon">
                            <Icon
                              name="reply"
                              size={19}
                            />
                          </span>

                          <span className="count">
                            {post.reply_count || ""}
                          </span>
                        </button>

                        {/* REPOST */}
                        <button
                          className={`action repost ${
                            post.reposted
                              ? "active-repost"
                              : ""
                          }`}
                          onClick={() =>
                            handleSocialAction(
                              "repost",
                              post.id
                            )
                          }
                          disabled={
                            actionLoading ===
                            `repost-${post.id}`
                          }
                          title="Repost"
                        >
                          <span className="action-icon">
                            <Icon
                              name="repost"
                              size={20}
                            />
                          </span>

                          <span className="count">
                            {post.repost_count ||
                              ""}
                          </span>
                        </button>

                        {/* BOOKMARK */}
                        <button
                          className={`action bookmark ${
                            post.bookmarked
                              ? "active-bookmark"
                              : ""
                          }`}
                          onClick={() =>
                            handleSocialAction(
                              "bookmark",
                              post.id
                            )
                          }
                          disabled={
                            actionLoading ===
                            `bookmark-${post.id}`
                          }
                          title="Bookmark"
                        >
                          <span className="action-icon">
                            <Icon
                              name="bookmark"
                              size={19}
                              filled={
                                post.bookmarked
                              }
                            />
                          </span>

                          <span className="count">
                            {post.bookmark_count ||
                              ""}
                          </span>
                        </button>

                        {/* EDIT */}
                        {ownPost && canEdit && (
                          <button
                            className="action edit-action"
                            onClick={() =>
                              startEditing(post)
                            }
                            title="Edit"
                          >
                            <span className="action-icon">
                              <Icon
                                name="edit"
                                size={18}
                              />
                            </span>

                            <span className="edit-label">
                              Edit
                            </span>
                          </button>
                        )}

                        <button
                          className="action share-action"
                          title="Share"
                        >
                          <Icon
                            name="share"
                            size={18}
                          />
                        </button>
                      </div>

                      {/* REPLY COMPOSER */}
                      {replyOpen[post.id] && (
                        <form
                          className="reply-box"
                          onSubmit={(event) =>
                            handleReply(
                              event,
                              post.id
                            )
                          }
                        >
                          <div className="avatar tiny">
                            {guest?.guest_handle
                              ?.charAt(0)
                              .toUpperCase() ||
                              "Y"}
                          </div>

                          <input
                            value={
                              replyText[
                                post.id
                              ] || ""
                            }
                            onChange={(event) =>
                              setReplyText(
                                (previous) => ({
                                  ...previous,
                                  [post.id]:
                                    event.target
                                      .value,
                                })
                              )
                            }
                            placeholder="Post your reply"
                          />

                          <button
                            type="submit"
                            disabled={
                              replyLoading ===
                                post.id ||
                              !replyText[
                                post.id
                              ]?.trim()
                            }
                          >
                            {replyLoading ===
                            post.id
                              ? "..."
                              : "Reply"}
                          </button>
                        </form>
                      )}

                      {/* REPLIES */}
                      {post.replies?.length >
                        0 && (
                        <div className="replies">
                          {post.replies.map(
                            (reply) => (
                              <div
                                className="reply"
                                key={reply.id}
                              >
                                <div className="reply-avatar">
                                  {reply.guest_handle
                                    ?.charAt(
                                      0
                                    )
                                    .toUpperCase() ||
                                    "Y"}
                                </div>

                                <div className="reply-content">
                                  <div className="reply-header">
                                    <strong>
                                      {reply.guest_handle ||
                                        "YourView User"}
                                    </strong>

                                    <span>
                                      @
                                      {reply.guest_handle ||
                                        "guest"}
                                    </span>

                                    <span className="dot">
                                      ·
                                    </span>

                                    <span>
                                      {formatDate(
                                        reply.created_at
                                      )}
                                    </span>
                                  </div>

                                  <p>
                                    {reply.body}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="right-sidebar">
          <div className="search-box">
            <Icon name="search" size={19} />

            <input
              placeholder="Search YourView"
            />
          </div>

          <section className="side-card">
            <h2>What's happening</h2>

            <div className="trend">
              <span>Trending</span>
              <strong>YourView</strong>
              <small>Latest conversations</small>
            </div>

            <div className="trend">
              <span>Trending</span>
              <strong>Community</strong>
              <small>See what people are saying</small>
            </div>

            <button className="show-more">
              Show more
            </button>
          </section>

          <section className="side-card">
            <h2>Who to follow</h2>

            <div className="follow-row">
              <div className="avatar small">
                Y
              </div>

              <div>
                <strong>YourView</strong>
                <span>@yourview</span>
              </div>

              <button className="follow-button">
                Follow
              </button>
            </div>
          </section>

          <div className="side-footer">
            <Link href="/guest/recover">
              Recover guest account
            </Link>

            <span>·</span>

            <span>Privacy</span>

            <span>·</span>

            <span>Terms</span>

            <span>·</span>

            <span>© 2026 YourView</span>
          </div>
        </aside>
      </div>

      {/* MOBILE NAV */}
      <nav className="mobile-nav">
        <Link
          href="/guest"
          className="mobile-nav-active"
          aria-label="Home"
        >
          <Icon name="home" size={23} />
        </Link>

        <Link
          href="/explore"
          aria-label="Explore"
        >
          <Icon name="search" size={23} />
        </Link>

        <Link
          href="/notifications"
          aria-label="Notifications"
        >
          <Icon name="bell" size={23} />
        </Link>

        <Link
          href="/messages"
          aria-label="Messages"
        >
          <Icon name="mail" size={23} />
        </Link>

        <Link
          href="/bookmarks"
          aria-label="Bookmarks"
        >
          <Icon name="bookmark" size={23} />
        </Link>

        <Link
          href={
            guest?.id
              ? `/profile?guest=${encodeURIComponent(
                  guest.id
                )}`
              : "/profile"
          }
          aria-label="Profile"
        >
          <Icon name="user" size={23} />
        </Link>
      </nav>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .app-shell {
          min-height: 100vh;
          background: #000;
          color: #e7e9ea;
        }

        .layout {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 250px minmax(0, 650px) 350px;
          min-height: 100vh;
        }

        /* LEFT */

        .left-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 12px 18px 20px 10px;
          display: flex;
          flex-direction: column;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px 18px;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #fff;
          color: #000;
          font-weight: 900;
          font-size: 20px;
        }

        .main-nav {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .nav-item {
          border: 0;
          background: transparent;
          color: #e7e9ea;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 13px 14px;
          border-radius: 999px;
          font-size: 20px;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
          text-decoration: none;
          width: 100%;
        }

        .nav-item:hover {
          background: #181818;
        }

        .nav-item.active {
          font-weight: 700;
        }

        .post-button {
          border: 0;
          background: #fff;
          color: #000;
          width: 100%;
          height: 48px;
          border-radius: 999px;
          font-size: 16px;
          font-weight: 800;
          margin-top: 22px;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .post-button:hover {
          opacity: 0.88;
        }

        .guest-card {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 14px;
        }

        .guest-card:hover {
          background: #181818;
        }

        .guest-info {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .guest-info strong {
          font-size: 14px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .guest-info span {
          color: #71767b;
          font-size: 13px;
        }

        /* FEED */

        .feed {
          border-left: 1px solid #2f3336;
          border-right: 1px solid #2f3336;
          min-height: 100vh;
        }

        .feed-header {
          position: sticky;
          top: 0;
          z-index: 10;
          height: 64px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #2f3336;
        }

        .feed-header h1 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.2px;
        }

        .feed-header span {
          color: #71767b;
          font-size: 12px;
        }

        .header-more,
        .more-button {
          border: 0;
          background: transparent;
          color: #71767b;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          cursor: pointer;
        }

        .header-more:hover,
        .more-button:hover {
          background: #181818;
          color: #e7e9ea;
        }

        /* COMPOSER */

        .composer {
          display: flex;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid #2f3336;
        }

        .composer-main {
          min-width: 0;
          flex: 1;
        }

        .composer textarea {
          width: 100%;
          min-height: 80px;
          resize: vertical;
          border: 0;
          outline: 0;
          background: transparent;
          color: #e7e9ea;
          font: inherit;
          font-size: 20px;
          line-height: 1.45;
          padding: 6px 0;
        }

        .composer textarea::placeholder {
          color: #71767b;
        }

        .composer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
        }

        .composer-tools button {
          border: 0;
          background: transparent;
          color: #1d9bf0;
          cursor: pointer;
        }

        .tool-square {
          display: grid;
          place-items: center;
          width: 26px;
          height: 26px;
          border: 1.7px solid currentColor;
          border-radius: 7px;
          font-size: 20px;
          line-height: 1;
        }

        .composer-post,
        .save-button {
          border: 0;
          background: #fff;
          color: #000;
          border-radius: 999px;
          padding: 9px 18px;
          font-weight: 800;
          cursor: pointer;
        }

        .composer-post:disabled,
        .save-button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        /* POST */

        .post {
          display: flex;
          gap: 12px;
          padding: 15px 18px;
          border-bottom: 1px solid #2f3336;
          transition: background 0.12s ease;
        }

        .post:hover {
          background: rgba(255, 255, 255, 0.025);
        }

        .post-avatar,
        .avatar {
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #252525;
          color: #fff;
          font-weight: 800;
          font-size: 17px;
        }

        .avatar.small {
          width: 38px;
          height: 38px;
          font-size: 15px;
        }

        .avatar.tiny {
          width: 34px;
          height: 34px;
          font-size: 13px;
        }

        .post-content {
          min-width: 0;
          flex: 1;
        }

        .post-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .author {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
          font-size: 14px;
        }

        .author strong {
          color: #e7e9ea;
          font-weight: 700;
        }

        .author span {
          color: #71767b;
        }

        .dot {
          color: #71767b;
        }

        .edited {
          color: #71767b;
        }

        .post-body {
          margin-top: 3px;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 15px;
          line-height: 1.45;
          color: #e7e9ea;
        }

        /* ACTIONS */

        .action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 500px;
          margin-top: 12px;
        }

        .action {
          min-width: 45px;
          height: 34px;
          padding: 0 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 0;
          background: transparent;
          color: #71767b;
          cursor: pointer;
          border-radius: 999px;
          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .action:hover {
          background: rgba(29, 155, 240, 0.1);
          color: #1d9bf0;
        }

        .action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .count {
          font-size: 12px;
          min-width: 4px;
        }

        .active-like {
          color: #f91880;
        }

        .active-like:hover {
          color: #f91880;
          background: rgba(249, 24, 128, 0.1);
        }

        .active-repost {
          color: #00ba7c;
        }

        .active-repost:hover {
          color: #00ba7c;
          background: rgba(0, 186, 124, 0.1);
        }

        .active-bookmark {
          color: #1d9bf0;
        }

        .active-bookmark:hover {
          color: #1d9bf0;
        }

        .active-reply {
          color: #1d9bf0;
        }

        .edit-action:hover {
          color: #1d9bf0;
        }

        .share-action {
          min-width: 34px;
        }

        .edit-label {
          font-size: 12px;
        }

        /* REPLY */

        .reply-box {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #2f3336;
        }

        .reply-box input {
          flex: 1;
          min-width: 0;
          height: 38px;
          border: 1px solid #2f3336;
          border-radius: 999px;
          background: transparent;
          color: #e7e9ea;
          outline: none;
          padding: 0 14px;
          font-size: 14px;
        }

        .reply-box input:focus {
          border-color: #1d9bf0;
        }

        .reply-box input::placeholder {
          color: #71767b;
        }

        .reply-box button {
          border: 0;
          border-radius: 999px;
          background: #fff;
          color: #000;
          font-weight: 700;
          padding: 8px 14px;
          cursor: pointer;
        }

        .reply-box button:disabled {
          opacity: 0.45;
          cursor: default;
        }

        .replies {
          margin-top: 12px;
          border-left: 1px solid #2f3336;
          padding-left: 12px;
        }

        .reply {
          display: flex;
          gap: 9px;
          padding: 10px 0;
        }

        .reply-avatar {
          flex: 0 0 auto;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #252525;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 800;
        }

        .reply-content {
          min-width: 0;
        }

        .reply-header {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
          font-size: 12px;
        }

        .reply-header span {
          color: #71767b;
        }

        .reply-content p {
          margin: 3px 0 0;
          font-size: 14px;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* EDIT */

        .edit-box {
          margin-top: 8px;
        }

        .edit-box textarea {
          width: 100%;
          min-height: 100px;
          resize: vertical;
          border: 1px solid #1d9bf0;
          border-radius: 10px;
          background: transparent;
          color: #e7e9ea;
          outline: none;
          padding: 10px;
          font: inherit;
          font-size: 15px;
          line-height: 1.45;
        }

        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }

        .cancel-button {
          border: 1px solid #2f3336;
          background: transparent;
          color: #e7e9ea;
          border-radius: 999px;
          padding: 8px 15px;
          cursor: pointer;
          font-weight: 700;
        }

        /* RIGHT */

        .right-sidebar {
          padding: 10px 18px;
        }

        .search-box {
          height: 44px;
          border-radius: 999px;
          background: #202327;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
          color: #71767b;
          margin-bottom: 16px;
        }

        .search-box input {
          border: 0;
          outline: 0;
          background: transparent;
          color: #e7e9ea;
          min-width: 0;
          flex: 1;
          font-size: 14px;
        }

        .side-card {
          background: #16181c;
          border-radius: 16px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .side-card h2 {
          margin: 0;
          padding: 15px 16px;
          font-size: 20px;
        }

        .trend {
          padding: 12px 16px;
          cursor: pointer;
        }

        .trend:hover,
        .follow-row:hover {
          background: #1d1f23;
        }

        .trend span,
        .trend small {
          display: block;
          color: #71767b;
          font-size: 12px;
        }

        .trend strong {
          display: block;
          margin: 3px 0;
          font-size: 14px;
        }

        .show-more {
          width: 100%;
          border: 0;
          background: transparent;
          color: #1d9bf0;
          text-align: left;
          padding: 14px 16px;
          cursor: pointer;
        }

        .follow-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
        }

        .follow-row > div:nth-child(2) {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .follow-row span {
          color: #71767b;
          font-size: 12px;
        }

        .follow-button {
          border: 0;
          border-radius: 999px;
          background: #fff;
          color: #000;
          padding: 7px 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .side-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          color: #71767b;
          font-size: 12px;
          padding: 0 8px;
        }

        .side-footer a {
          color: #71767b;
          text-decoration: none;
        }

        .side-footer a:hover {
          text-decoration: underline;
        }

        /* STATES */

        .error-banner {
          margin: 12px 18px;
          padding: 10px 12px;
          border: 1px solid #4b2528;
          border-radius: 10px;
          background: #201315;
          color: #f2a6aa;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
        }

        .error-banner button {
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .loading-state {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #71767b;
          font-size: 14px;
        }

        .spinner {
          width: 28px;
          height: 28px;
          border: 2px solid #2f3336;
          border-top-color: #e7e9ea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-state {
          padding: 70px 30px;
          text-align: center;
        }

        .empty-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 18px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #16181c;
        }

        .empty-state h2 {
          margin: 0 0 8px;
          font-size: 22px;
        }

        .empty-state p {
          margin: 0;
          color: #71767b;
        }

        /* MOBILE */

        .mobile-nav {
          display: none;
        }

        @media (max-width: 1100px) {
          .layout {
            grid-template-columns: 80px minmax(0, 650px);
            justify-content: center;
          }

          .left-sidebar {
            padding: 10px;
            align-items: center;
          }

          .brand {
            padding: 10px;
          }

          .brand span,
          .nav-item span,
          .guest-info,
          .post-button {
            display: none;
          }

          .nav-item {
            width: 50px;
            height: 50px;
            padding: 0;
            justify-content: center;
          }

          .guest-card {
            padding: 5px;
          }

          .right-sidebar {
            display: none;
          }
        }

        @media (max-width: 700px) {
          .layout {
            display: block;
            width: 100%;
          }

          .left-sidebar {
            display: none;
          }

          .feed {
            border-left: 0;
            border-right: 0;
            padding-bottom: 60px;
          }

          .feed-header {
            height: 56px;
          }

          .composer {
            padding: 12px;
          }

          .composer textarea {
            font-size: 18px;
          }

          .post {
            padding: 13px 12px;
          }

          .post-avatar {
            width: 38px;
            height: 38px;
            font-size: 15px;
          }

          .author {
            font-size: 13px;
          }

          .post-body {
            font-size: 15px;
          }

          .action-bar {
            max-width: none;
          }

          .edit-label {
            display: none;
          }

          .mobile-nav {
            position: fixed;
            z-index: 50;
            bottom: 0;
            left: 0;
            right: 0;
            height: 58px;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(12px);
            border-top: 1px solid #2f3336;
            display: flex;
            align-items: center;
            justify-content: space-around;
          }

          .mobile-nav a {
            width: 44px;
            height: 44px;
            display: grid;
            place-items: center;
            border: 0;
            background: transparent;
            color: #71767b;
            border-radius: 50%;
            text-decoration: none;
          }

          .mobile-nav a:hover {
            background: #181818;
          }

          .mobile-nav-active {
            color: #e7e9ea !important;
          }
        }
      `}</style>
    </main>
  );
}