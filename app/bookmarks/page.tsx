"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

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


export default function BookmarksPage() {
  const [guest, setGuest] =
    useState<GuestSession | null>(null);

  const [posts, setPosts] =
    useState<Post[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [replyLoading, setReplyLoading] =
    useState<string | null>(null);

  const [editLoading, setEditLoading] =
    useState<string | null>(null);


  useEffect(() => {
    loadBookmarks();
  }, []);


  async function loadBookmarks() {
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

      const response =
        await fetch(
          "/api/bookmarks",
          {
            method: "GET",

            headers: {
              "x-yourview-guest-id":
                session.id,
            },

            cache: "no-store",
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to load bookmarks."
        );
      }

      setPosts(
        Array.isArray(
          result?.posts
        )
          ? result.posts
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load bookmarks."
      );
    } finally {
      setLoading(false);
    }
  }


  async function handleSocialAction(
    type: ActionType,
    postId: string
  ) {
    if (!guest) return;

    const key =
      type + "-" + postId;

    try {
      setActionLoading(key);
      setError("");

      const response =
        await fetch(
          "/api/posts/" + type,
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
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to update post."
        );
      }

      if (type === "bookmark") {
        if (
          result?.bookmarked === false
        ) {
          setPosts(
            (previous) =>
              previous.filter(
                (post) =>
                  post.id !==
                  postId
              )
          );

          return;
        }
      }

      setPosts(
        (previous) =>
          previous.map(
            (post) => {
              if (
                post.id !== postId
              ) {
                return post;
              }

              if (
                type === "like"
              ) {
                const liked =
                  Boolean(
                    result?.liked
                  );

                return {
                  ...post,
                  liked,
                  like_count:
                    typeof result?.like_count ===
                    "number"
                      ? result.like_count
                      : post.like_count,
                };
              }

              if (
                type === "repost"
              ) {
                const reposted =
                  Boolean(
                    result?.reposted
                  );

                return {
                  ...post,
                  reposted,
                  repost_count:
                    typeof result?.repost_count ===
                    "number"
                      ? result.repost_count
                      : post.repost_count,
                };
              }

              if (
                type ===
                "bookmark"
              ) {
                const bookmarked =
                  Boolean(
                    result?.bookmarked
                  );

                return {
                  ...post,
                  bookmarked,
                  bookmark_count:
                    typeof result?.bookmark_count ===
                    "number"
                      ? result.bookmark_count
                      : post.bookmark_count,
                };
              }

              return post;
            }
          )
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update post."
      );
    } finally {
      setActionLoading(null);
    }
  }


  async function handleReply(
    event: FormEvent<HTMLFormElement>,
    postId: string,
    body: string
  ) {
    event.preventDefault();

    if (!guest) return;

    const cleanBody =
      body.trim();

    if (!cleanBody) return;

    try {
      setReplyLoading(postId);
      setError("");

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
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to add reply."
        );
      }

      if (result?.reply) {
        setPosts(
          (previous) =>
            previous.map(
              (post) => {
                if (
                  post.id !==
                  postId
                ) {
                  return post;
                }

                return {
                  ...post,

                  replies: [
                    ...post.replies,
                    result.reply,
                  ],

                  reply_count:
                    post.reply_count +
                    1,
                };
              }
            )
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to add reply."
      );
    } finally {
      setReplyLoading(null);
    }
  }


  async function handleEdit(
    event: FormEvent<HTMLFormElement>,
    postId: string,
    body: string
  ) {
    event.preventDefault();

    if (!guest) return;

    const cleanBody =
      body.trim();

    if (!cleanBody) return;

    try {
      setEditLoading(postId);
      setError("");

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
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to edit post."
        );
      }

      setPosts(
        (previous) =>
          previous.map(
            (post) =>
              post.id === postId
                ? {
                    ...post,
                    body:
                      result?.post
                        ?.body ||
                      cleanBody,
                    updated_at:
                      result?.post
                        ?.updated_at ||
                      new Date().toISOString(),
                  }
                : post
          )
      );
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
    <SocialLayout
      guestHandle={
        guest?.guest_handle
      }
      active="bookmarks"
    >
      <section className="feed">
        <header className="feed-header">
          <div className="bookmarks-header">
            <strong>
              Bookmarks
            </strong>
          </div>
        </header>


        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}


        {loading ? (
          <div className="loading-state">
            <div className="spinner" />

            <span>
              Loading bookmarks...
            </span>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-bookmarks">
            <div className="bookmark-icon">
              🔖
            </div>

            <h2>
              Save posts for later
            </h2>

            <p>
              When you bookmark a post,
              it will appear here.
            </p>
          </div>
        ) : (
          <div>
            {posts.map(
              (post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  guestId={
                    guest?.id
                  }
                  actionLoading={
                    actionLoading
                  }
                  replyLoading={
                    replyLoading
                  }
                  editLoading={
                    editLoading
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
        <div className="side-card">
          <h2>
            Bookmarks
          </h2>

          <p>
            Save posts you want to
            find again later.
          </p>
        </div>
      </aside>


      <style>{`
        .bookmarks-header {
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 18px;
        }

        .bookmarks-header strong {
          color: #e7e9ea;
          font-size: 20px;
          font-weight: 800;
        }

        .empty-bookmarks {
          min-height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
        }

        .bookmark-icon {
          width: 56px;
          height: 56px;
          border: 1px solid #536471;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          margin-bottom: 18px;
        }

        .empty-bookmarks h2 {
          margin: 0;
          color: #e7e9ea;
          font-size: 24px;
          font-weight: 800;
        }

        .empty-bookmarks p {
          max-width: 390px;
          margin: 10px 0 0;
          color: #71767b;
          font-size: 15px;
          line-height: 1.5;
        }

        @media (max-width: 700px) {
          .bookmarks-header {
            padding-left: 12px;
            padding-right: 12px;
          }
        }
      `}</style>
    </SocialLayout>
  );
}