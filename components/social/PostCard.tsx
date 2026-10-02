"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Icon from "@/components/social/Icon";

export type Reply = {
  id: string;
  post_id: string;
  user_id: string | null;
  guest_handle: string | null;
  body: string;
  created_at: string;
};

export type Post = {
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

export type ActionType =
  | "like"
  | "repost"
  | "bookmark";

type PostCardProps = {
  post: Post;
  guestId?: string | null;

  actionLoading?: string | null;
  replyLoading?: string | null;
  editLoading?: string | null;

  onSocialAction?: (
    type: ActionType,
    postId: string
  ) => void;

  onReply?: (
    event: FormEvent<HTMLFormElement>,
    postId: string,
    body: string
  ) => void;

  onEdit?: (
    event: FormEvent<HTMLFormElement>,
    postId: string,
    body: string
  ) => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  const now = Date.now();
  const diff = Math.max(
    0,
    now - date.getTime()
  );

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isEditable(
  createdAt: string,
  now: number
) {
  if (!now) {
    return false;
  }

  return (
    now -
      new Date(createdAt).getTime() <
    5 * 60 * 1000
  );
}

export default function PostCard({
  post,
  guestId,
  actionLoading = null,
  replyLoading = null,
  editLoading = null,
  onSocialAction,
  onReply,
  onEdit,
}: PostCardProps) {
  const [replyOpen, setReplyOpen] =
    useState(false);

  const [replyText, setReplyText] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [editingText, setEditingText] =
    useState("");

  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () =>
      window.clearInterval(timer);
  }, []);

  const ownPost = Boolean(
    guestId &&
      post.guest_id === guestId
  );

  const canEdit =
    ownPost &&
    isEditable(
      post.created_at,
      now
    );

  function startEditing() {
    setEditing(true);
    setEditingText(post.body);
  }

  function cancelEditing() {
    setEditing(false);
    setEditingText("");
  }

  function handleEditSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingText.trim()) {
      return;
    }

    if (!onEdit) {
      return;
    }

    onEdit(
      event,
      post.id,
      editingText
    );

    setEditing(false);
    setEditingText("");
  }

  function handleReplySubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedReply =
      replyText.trim();

    if (!trimmedReply) {
      return;
    }

    if (!onReply) {
      return;
    }

    onReply(
      event,
      post.id,
      trimmedReply
    );

    setReplyText("");
  }

  return (
    <article className="post">
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

          <button
            className="more-button"
            type="button"
            aria-label="More"
          >
            <Icon
              name="more"
              size={19}
            />
          </button>
        </div>

        {editing ? (
          <form
            className="edit-box"
            onSubmit={
              handleEditSubmit
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

        {/* EXACT ORDER:
            LIKE → REPLY → REPOST → BOOKMARK → EDIT → SHARE
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
              onSocialAction?.(
                "like",
                post.id
              )
            }
            disabled={
              actionLoading ===
              `like-${post.id}`
            }
            title="Like"
            type="button"
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
              replyOpen
                ? "active-reply"
                : ""
            }`}
            onClick={() =>
              setReplyOpen(
                (previous) =>
                  !previous
              )
            }
            title="Reply"
            type="button"
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
              onSocialAction?.(
                "repost",
                post.id
              )
            }
            disabled={
              actionLoading ===
              `repost-${post.id}`
            }
            title="Repost"
            type="button"
          >
            <span className="action-icon">
              <Icon
                name="repost"
                size={20}
              />
            </span>

            <span className="count">
              {post.repost_count || ""}
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
              onSocialAction?.(
                "bookmark",
                post.id
              )
            }
            disabled={
              actionLoading ===
              `bookmark-${post.id}`
            }
            title="Bookmark"
            type="button"
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
              onClick={
                startEditing
              }
              title="Edit"
              type="button"
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

          {/* SHARE */}
          <button
            className="action share-action"
            title="Share"
            type="button"
          >
            <Icon
              name="share"
              size={18}
            />
          </button>
        </div>

        {/* REPLY COMPOSER */}
        {replyOpen && (
          <form
            className="reply-box"
            onSubmit={
              handleReplySubmit
            }
          >
            <div className="avatar tiny">
              Y
            </div>

            <input
              value={replyText}
              onChange={(event) =>
                setReplyText(
                  event.target.value
                )
              }
              placeholder="Post your reply"
            />

            <button
              type="submit"
              disabled={
                replyLoading ===
                  post.id ||
                !replyText.trim()
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
                      ?.charAt(0)
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

      <style jsx>{`
        .post {
          display: flex;
          gap: 12px;
          padding: 15px 18px;
          border-bottom: 1px solid #2f3336;
          transition: background 0.12s ease;
        }

        .post:hover {
          background: rgba(
            255,
            255,
            255,
            0.025
          );
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

        .more-button:hover {
          background: #181818;
          color: #e7e9ea;
        }

        .post-body {
          margin-top: 3px;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 15px;
          line-height: 1.45;
          color: #e7e9ea;
        }

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
          background: rgba(
            29,
            155,
            240,
            0.1
          );
          color: #1d9bf0;
        }

        .action:disabled {
          cursor: default;
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
          background: rgba(
            249,
            24,
            128,
            0.1
          );
        }

        .active-repost {
          color: #00ba7c;
        }

        .active-repost:hover {
          color: #00ba7c;
          background: rgba(
            0,
            186,
            124,
            0.1
          );
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

        .save-button {
          border: 0;
          background: #fff;
          color: #000;
          border-radius: 999px;
          padding: 9px 18px;
          font-weight: 800;
          cursor: pointer;
        }

        .save-button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        @media (max-width: 700px) {
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
        }
      `}</style>
    </article>
  );
}