```tsx
"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import Icon from "@/components/social/Icon";
import SocialLayout from "@/components/social/SocialLayout";

import PostCard, {
  type ActionType,
  type Post,
} from "@/components/social/PostCard";

import {
  createGuestSession,
  getGuestSession,
  type GuestSession,
} from "@/lib/guest/session";

type ExploreUser = {
  id: string;
  guest_handle: string;
  created_at: string;
  following?: boolean;
};

type SearchResult = {
  posts: Post[];
  users: ExploreUser[];
};

export default function ExplorePage() {
  const [guest, setGuest] =
    useState<GuestSession | null>(null);

  const [query, setQuery] =
    useState("");

  const [submittedQuery, setSubmittedQuery] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<
      "top" | "latest" | "people"
    >("top");

  const [results, setResults] =
    useState<SearchResult>({
      posts: [],
      users: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState<
      Record<
        string,
        ActionType | null
      >
    >({});

  const [followLoading, setFollowLoading] =
    useState<string | null>(null);

  /*
   * --------------------------------------------------
   * LOAD / CREATE GUEST
   * --------------------------------------------------
   */

  async function getOrCreateGuest() {
    let currentGuest =
      await getGuestSession();

    if (!currentGuest) {
      currentGuest =
        await createGuestSession();
    }

    setGuest(currentGuest);

    return currentGuest;
  }

  /*
   * --------------------------------------------------
   * EXPLORE SEARCH
   * --------------------------------------------------
   */

  async function searchExplore(
    searchText: string,
    guestId?: string
  ) {
    const cleanQuery =
      searchText.trim();

    const activeGuestId =
      guestId || guest?.id;

    if (!activeGuestId) {
      setError(
        "Guest session is not ready."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/explore/search?q=${encodeURIComponent(
            cleanQuery
          )}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              "x-yourview-guest-id":
                activeGuestId,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to search Explore."
        );
      }

      /*
       * The API has already returned both:
       *
       * data.posts
       * data.users
       *
       * Store both together.
       */

      setResults({
        posts:
          Array.isArray(
            data?.posts
          )
            ? data.posts
            : [],

        users:
          Array.isArray(
            data?.users
          )
            ? data.users
            : [],
      });
    } catch (err) {
      console.error(
        "Explore search error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to search Explore."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * SEARCH SUBMIT
   * --------------------------------------------------
   */

  async function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanQuery =
      query.trim();

    setSubmittedQuery(
      cleanQuery
    );

    await searchExplore(
      cleanQuery
    );
  }

  /*
   * --------------------------------------------------
   * TAB CHANGE
   * --------------------------------------------------
   *
   * IMPORTANT:
   *
   * Do NOT perform another API request here.
   *
   * The search request already returns:
   *
   * posts + users
   *
   * Switching tabs should simply display the
   * appropriate part of the existing result.
   * --------------------------------------------------
   */

  function handleTabChange(
    tab:
      | "top"
      | "latest"
      | "people"
  ) {
    setActiveTab(tab);
  }

  /*
   * --------------------------------------------------
   * LIKE / REPOST / BOOKMARK
   * --------------------------------------------------
   */

  async function handleSocialAction(
    type: ActionType,
    postId: string
  ) {
    if (!guest?.id) {
      setError(
        "Guest session is not ready."
      );
      return;
    }

    setActionLoading(
      (current) => ({
        ...current,
        [postId]: type,
      })
    );

    setError("");

    try {
      const response =
        await fetch(
          `/api/posts/${type}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",

              "x-yourview-guest-id":
                guest.id,
            },
            body: JSON.stringify({
              post_id: postId,
              guest_id:
                guest.id,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            `Unable to ${type} this post.`
        );
      }

      setResults(
        (current) => ({
          ...current,

          posts:
            current.posts.map(
              (post) => {
                if (
                  post.id !==
                  postId
                ) {
                  return post;
                }

                if (
                  type ===
                  "like"
                ) {
                  return {
                    ...post,

                    liked:
                      Boolean(
                        result.liked
                      ),

                    like_count:
                      result.like_count ??
                      post.like_count ??
                      0,
                  };
                }

                if (
                  type ===
                  "repost"
                ) {
                  return {
                    ...post,

                    reposted:
                      Boolean(
                        result.reposted
                      ),

                    repost_count:
                      result.repost_count ??
                      post.repost_count ??
                      0,
                  };
                }

                return {
                  ...post,

                  bookmarked:
                    Boolean(
                      result.bookmarked
                    ),

                  bookmark_count:
                    result.bookmark_count ??
                    post.bookmark_count ??
                    0,
                };
              }
            ),
        })
      );
    } catch (err) {
      console.error(
        "Explore social action error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${type} this post.`
      );
    } finally {
      setActionLoading(
        (current) => ({
          ...current,
          [postId]: null,
        })
      );
    }
  }

  /*
   * --------------------------------------------------
   * REPLY
   * --------------------------------------------------
   */

  async function handleReply(
    event: FormEvent<HTMLFormElement>,
    postId: string,
    body: string
  ) {
    event.preventDefault();

    if (!guest?.id) {
      setError(
        "Guest session is not ready."
      );
      return;
    }

    const cleanBody =
      body.trim();

    if (!cleanBody) {
      setError(
        "Reply text is required."
      );
      return;
    }

    setError("");

    try {
      const response =
        await fetch(
          "/api/posts/reply",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",

              "x-yourview-guest-id":
                guest.id,
            },
            body: JSON.stringify({
              post_id: postId,
              body: cleanBody,
              guest_id:
                guest.id,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to post reply."
        );
      }

      if (result?.reply) {
        setResults(
          (current) => ({
            ...current,

            posts:
              current.posts.map(
                (post) =>
                  post.id ===
                  postId
                    ? {
                        ...post,

                        replies: [
                          ...(post.replies ||
                            []),

                          result.reply,
                        ],

                        reply_count:
                          result.reply_count ??
                          (post.reply_count ||
                            0) +
                            1,
                      }
                    : post
              ),
          })
        );
      }
    } catch (err) {
      console.error(
        "Explore reply error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to post reply."
      );
    }
  }

  /*
   * --------------------------------------------------
   * EDIT
   * --------------------------------------------------
   */

  async function handleEdit(
    event: FormEvent<HTMLFormElement>,
    postId: string,
    body: string
  ) {
    event.preventDefault();

    if (!guest?.id) {
      setError(
        "Guest session is not ready."
      );
      return;
    }

    const cleanBody =
      body.trim();

    if (!cleanBody) {
      setError(
        "Post text is required."
      );
      return;
    }

    setError("");

    try {
      const response =
        await fetch(
          "/api/posts",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",

              "x-yourview-guest-id":
                guest.id,
            },
            body: JSON.stringify({
              post_id: postId,
              body: cleanBody,
              guest_id:
                guest.id,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to edit post."
        );
      }

      setResults(
        (current) => ({
          ...current,

          posts:
            current.posts.map(
              (post) =>
                post.id ===
                postId
                  ? {
                      ...post,

                      body:
                        result?.post
                          ?.body ??
                        cleanBody,

                      updated_at:
                        result?.post
                          ?.updated_at ??
                        new Date().toISOString(),
                    }
                  : post
            ),
        })
      );
    } catch (err) {
      console.error(
        "Explore edit error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to edit post."
      );
    }
  }

  /*
   * --------------------------------------------------
   * FOLLOW GUEST
   * --------------------------------------------------
   */

  async function handleFollow(
    user: ExploreUser
  ) {
    if (!guest?.id) {
      setError(
        "Guest session is not ready."
      );
      return;
    }

    if (
      user.id ===
      guest.id
    ) {
      setError(
        "You cannot follow yourself."
      );
      return;
    }

    setFollowLoading(
      user.id
    );

    setError("");

    try {
      const response =
        await fetch(
          "/api/follows",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",

              "x-yourview-guest-id":
                guest.id,
            },

            body: JSON.stringify({
              following_guest_id:
                user.id,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to update follow."
        );
      }

      setResults(
        (current) => ({
          ...current,

          users:
            current.users.map(
              (item) =>
                item.id ===
                user.id
                  ? {
                      ...item,

                      following:
                        Boolean(
                          result.following
                        ),
                    }
                  : item
            ),
        })
      );
    } catch (err) {
      console.error(
        "Explore follow error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update follow."
      );
    } finally {
      setFollowLoading(
        null
      );
    }
  }

  /*
   * --------------------------------------------------
   * INITIALIZE
   * --------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const currentGuest =
          await getOrCreateGuest();

        if (cancelled) {
          return;
        }

        await searchExplore(
          "",
          currentGuest.id
        );
      } catch (err) {
        console.error(
          "Explore initialization error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to initialize Explore."
          );

          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * --------------------------------------------------
   * POSTS
   * --------------------------------------------------
   */

  const visiblePosts =
    activeTab === "latest"
      ? [...results.posts].sort(
          (a, b) =>
            new Date(
              b.created_at
            ).getTime() -
            new Date(
              a.created_at
            ).getTime()
        )
      : results.posts;

  return (
    <SocialLayout
      guestHandle={
        guest?.guest_handle
      }
      active="explore"
    >
      <section className="feed">
        <header className="feed-header">
          <div>
            <h1>Explore</h1>

            <span>
              Discover what is happening
              on YourView.
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

        <div className="search-section">
          <form
            onSubmit={handleSearch}
            className="search-box"
          >
            <Icon
              name="search"
              size={19}
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search YourView"
              aria-label="Search YourView"
            />

            {query && (
              <button
                type="button"
                className="clear-search"
                onClick={async () => {
                  setQuery("");
                  setSubmittedQuery("");

                  if (guest?.id) {
                    await searchExplore(
                      "",
                      guest.id
                    );
                  }
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </form>
        </div>

        <div className="tabs">
          <button
            type="button"
            className={
              activeTab === "top"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              handleTabChange("top")
            }
          >
            Top
          </button>

          <button
            type="button"
            className={
              activeTab === "latest"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              handleTabChange(
                "latest"
              )
            }
          >
            Latest
          </button>

          <button
            type="button"
            className={
              activeTab === "people"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              handleTabChange(
                "people"
              )
            }
          >
            People
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />

            <span>
              Loading Explore...
            </span>
          </div>
        ) : activeTab ===
          "people" ? (
          results.users.length ===
          0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon
                  name="profile"
                  size={30}
                />
              </div>

              <h2>
                No people found
              </h2>

              <p>
                {submittedQuery
                  ? `No guest account matches "${submittedQuery}".`
                  : "Search for a guest name or handle to find people on YourView."}
              </p>
            </div>
          ) : (
            <div className="people-list">
              {results.users.map(
                (user) => {
                  const isFollowing =
                    Boolean(
                      user.following
                    );

                  const isLoading =
                    followLoading ===
                    user.id;

                  return (
                    <article
                      className="person-row"
                      key={user.id}
                    >
                      <Link
                        href={`/profile?guest=${encodeURIComponent(
                          user.id
                        )}`}
                        className="person-main"
                      >
                        <div className="avatar">
                          {(
                            user.guest_handle?.charAt(
                              0
                            ) ||
                            "G"
                          ).toUpperCase()}
                        </div>

                        <div className="person-info">
                          <strong>
                            {
                              user.guest_handle
                            }
                          </strong>

                          <span>
                            @
                            {
                              user.guest_handle
                            }
                          </span>

                          <small>
                            Guest account
                          </small>
                        </div>
                      </Link>

                      <div className="person-actions">
                        <Link
                          href={`/profile?guest=${encodeURIComponent(
                            user.id
                          )}`}
                          className="view-button"
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          className={
                            isFollowing
                              ? "follow-button following"
                              : "follow-button"
                          }
                          disabled={
                            isLoading
                          }
                          onClick={() =>
                            handleFollow(
                              user
                            )
                          }
                        >
                          {isLoading
                            ? "..."
                            : isFollowing
                            ? "Following"
                            : "Follow"}
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )
        ) : visiblePosts.length ===
          0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon
                name="explore"
                size={30}
              />
            </div>

            <h2>
              {submittedQuery
                ? "No posts found"
                : "Welcome to Explore"}
            </h2>

            <p>
              {submittedQuery
                ? "Try a different search term."
                : "Search for posts and people to discover conversations happening on YourView."}
            </p>
          </div>
        ) : (
          <div>
            {visiblePosts.map(
              (post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  guestId={
                    guest?.id
                  }
                  actionLoading={
                    actionLoading[
                      post.id
                    ]
                  }
                  onSocialAction={
                    handleSocialAction
                  }
                  onReply={
                    handleReply
                  }
                  onEdit={
                    handleEdit
                  }
                />
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

          <span>
            Search YourView
          </span>
        </div>

        <section className="side-card">
          <h2>
            What&apos;s happening
          </h2>

          <div className="trend">
            <span>
              Trending
            </span>

            <strong>
              YourView
            </strong>

            <small>
              Latest conversations
            </small>
          </div>

          <div className="trend">
            <span>
              Community
            </span>

            <strong>
              YourView users
            </strong>

            <small>
              Discover people and
              conversations
            </small>
          </div>
        </section>

        <section className="side-card">
          <h2>
            New to YourView?
          </h2>

          <p>
            Search for people,
            follow users and join
            conversations.
          </p>
        </section>
      </aside>

      <style jsx>{`
        .search-section {
          padding: 14px 18px;
          border-bottom: 1px solid #2f3336;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #202327;
          border-radius: 999px;
          padding: 11px 15px;
          color: #71767b;
        }

        .search-box:focus-within {
          outline: 1px solid #1d9bf0;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #e7e9ea;
          font-size: 15px;
        }

        .search-box input::placeholder {
          color: #71767b;
        }

        .clear-search {
          border: 0;
          background: transparent;
          color: #71767b;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }

        .tabs {
          display: grid;
          grid-template-columns: repeat(
            3,
            1fr
          );
          border-bottom: 1px solid #2f3336;
        }

        .tab {
          position: relative;
          border: 0;
          background: transparent;
          color: #71767b;
          padding: 15px 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
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
          left: 30%;
          right: 30%;
          bottom: 0;
          height: 3px;
          border-radius: 999px;
          background: #1d9bf0;
        }

        .people-list {
          width: 100%;
        }

        .person-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid #2f3336;
        }

        .person-row:hover {
          background: rgba(
            255,
            255,
            255,
            0.025
          );
        }

        .person-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
          color: inherit;
          text-decoration: none;
        }

        .person-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .person-info strong {
          color: #e7e9ea;
          font-size: 15px;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .person-info span {
          color: #71767b;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .person-info small {
          color: #71767b;
          font-size: 12px;
        }

        .person-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .view-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 13px;
          border: 1px solid #2f3336;
          border-radius: 999px;
          color: #e7e9ea;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
        }

        .view-button:hover {
          background: #181818;
        }

        .follow-button {
          min-width: 82px;
          min-height: 34px;
          padding: 0 14px;
          border: 0;
          border-radius: 999px;
          background: #e7e9ea;
          color: #000;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .follow-button:hover {
          background: #fff;
        }

        .follow-button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .follow-button.following {
          background: transparent;
          border: 1px solid #2f3336;
          color: #e7e9ea;
        }

        .follow-button.following:hover {
          border-color: #f4212e;
          color: #f4212e;
          background: rgba(
            244,
            33,
            46,
            0.08
          );
        }

        .error-banner {
          margin: 10px 18px;
          padding: 10px 13px;
          border: 1px solid #7f1d1d;
          border-radius: 10px;
          background: #1c0d0d;
          color: #fca5a5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .error-banner button {
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 20px;
          cursor: pointer;
        }

        .empty-state {
          padding: 55px 24px;
          text-align: center;
        }

        .empty-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #181818;
          color: #71767b;
        }

        .empty-state h2 {
          margin: 0;
          font-size: 20px;
        }

        .empty-state p {
          max-width: 420px;
          margin: 8px auto 0;
          color: #71767b;
          line-height: 1.5;
          font-size: 14px;
        }

        .loading-state {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #71767b;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #2f3336;
          border-top-color: #e7e9ea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .trend {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 10px 0;
        }

        .trend span,
        .trend small {
          color: #71767b;
          font-size: 12px;
        }

        .trend strong {
          color: #e7e9ea;
          font-size: 14px;
        }

        .side-card p {
          color: #71767b;
          line-height: 1.5;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 700px) {
          .person-row {
            padding: 13px 15px;
          }

          .person-actions {
            gap: 5px;
          }

          .view-button {
            display: none;
          }

          .follow-button {
            min-width: 76px;
          }
        }
      `}</style>
    </SocialLayout>
  );
}