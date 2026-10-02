"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";

import SocialLayout from "@/components/social/SocialLayout";
import PostCard, {
  Post,
  ActionType,
} from "@/components/social/PostCard";
import Icon from "@/components/social/Icon";

type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  date_of_birth: string | null;
  is_verified: boolean;
  created_at: string;
  guest_handle?: string | null;
  is_guest?: boolean;
  following?: boolean;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
};

type ProfileResponse = {
  profile: ProfileData;
  posts: Post[];
  replies: Post[];
  reposts: Post[];
  likes: Post[];
};

type TabType =
  | "posts"
  | "replies"
  | "reposts"
  | "likes";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const guestParam = searchParams.get("guest");
  const userParam = searchParams.get("user");

  const [guestId, setGuestId] = useState<string | null>(null);
  const [viewerGuestId, setViewerGuestId] =
    useState<string | null>(null);

  const [data, setData] =
    useState<ProfileResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] =
    useState<TabType>("posts");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [replyLoading, setReplyLoading] =
    useState<string | null>(null);

  const [editLoading, setEditLoading] =
    useState<string | null>(null);

  const [followLoading, setFollowLoading] =
    useState(false);

  const [shareMessage, setShareMessage] =
    useState("");

  const [editingProfile, setEditingProfile] =
    useState(false);

  const [editBio, setEditBio] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editDob, setEditDob] = useState("");

  /*
   * Resolve the current guest session.
   */
  useEffect(() => {
    async function loadGuestSession() {
      try {
        const response = await fetch(
          "/api/guest/session",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        const currentGuest =
          result?.guest?.id ||
          result?.id ||
          result?.guest_id ||
          null;

        const currentGuestId =
          typeof currentGuest === "string"
            ? currentGuest
            : null;

        setViewerGuestId(currentGuestId);
      } catch {
        // Registered users may not have a guest session.
      }
    }

    loadGuestSession();
  }, []);

  /*
   * Load profile.
   */
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        let url = "/api/profile";

        if (guestParam) {
          url +=
            "?guest=" +
            encodeURIComponent(guestParam);
        } else if (userParam) {
          url +=
            "?user=" +
            encodeURIComponent(userParam);
        }

        const response = await fetch(url, {
          cache: "no-store",
          headers: viewerGuestId
            ? {
                "x-yourview-guest-id":
                  viewerGuestId,
              }
            : undefined,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to load profile."
          );
        }

        if (!result?.profile) {
          throw new Error(
            "Profile information was not found."
          );
        }

        setData({
          profile: result.profile,
          posts: Array.isArray(result.posts)
            ? result.posts
            : [],
          replies: Array.isArray(result.replies)
            ? result.replies
            : [],
          reposts: Array.isArray(result.reposts)
            ? result.reposts
            : [],
          likes: Array.isArray(result.likes)
            ? result.likes
            : [],
        });

        setGuestId(
          result.profile?.guest_id ||
            result.profile?.id ||
            guestParam ||
            null
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [guestParam, userParam, viewerGuestId]);

  const profile = data?.profile || null;

  /*
   * Determine whether this is the viewer's own profile.
   */
  const isOwnProfile = useMemo(() => {
    if (!profile) {
      return false;
    }

    if (
      viewerGuestId &&
      profile.is_guest &&
      profile.id === viewerGuestId
    ) {
      return true;
    }

    if (
      userParam &&
      profile.id === userParam
    ) {
      return true;
    }

    if (
      guestParam &&
      profile.guest_handle &&
      guestParam === profile.guest_handle &&
      viewerGuestId &&
      profile.id === viewerGuestId
    ) {
      return true;
    }

    return false;
  }, [
    profile,
    viewerGuestId,
    userParam,
    guestParam,
  ]);

  /*
   * Profile activity for the selected tab.
   */
  const visiblePosts = useMemo(() => {
    if (!data) {
      return [];
    }

    switch (activeTab) {
      case "replies":
        return data.replies || [];

      case "reposts":
        return data.reposts || [];

      case "likes":
        return data.likes || [];

      case "posts":
      default:
        return data.posts || [];
    }
  }, [data, activeTab]);

  function displayName() {
    if (!profile) {
      return "";
    }

    return (
      profile.display_name ||
      profile.guest_handle ||
      profile.username ||
      "User"
    );
  }

  function username() {
    if (!profile) {
      return "";
    }

    return (
      profile.guest_handle ||
      profile.username ||
      ""
    );
  }

  function joinedDate() {
    if (!profile?.created_at) {
      return "";
    }

    const date = new Date(profile.created_at);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        year: "numeric",
      }
    );
  }

  function formattedDob() {
    if (!profile?.date_of_birth) {
      return "";
    }

    const date = new Date(
      profile.date_of_birth +
        "T00:00:00"
    );

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  /*
   * Social actions.
   */
  async function handleSocialAction(
    type: ActionType,
    postId: string
  ) {
    const key = `${type}:${postId}`;

    if (actionLoading === key) {
      return;
    }

    setActionLoading(key);

    try {
      const response = await fetch(
        `/api/posts/${type}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            ...(viewerGuestId
              ? {
                  "x-yourview-guest-id":
                    viewerGuestId,
                }
              : {}),
          },
          body: JSON.stringify({
            post_id: postId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Unable to ${type} post.`
        );
      }

      setData((current) => {
        if (!current) {
          return current;
        }

        const updatePost = (
          post: Post
        ): Post => {
          if (post.id !== postId) {
            return post;
          }

          if (type === "like") {
            const liked =
              Boolean(result?.liked);

            return {
              ...post,
              liked,
              like_count: liked
                ? post.like_count + 1
                : Math.max(
                    0,
                    post.like_count - 1
                  ),
            };
          }

          if (type === "repost") {
            const reposted =
              Boolean(result?.reposted);

            return {
              ...post,
              reposted,
              repost_count: reposted
                ? post.repost_count + 1
                : Math.max(
                    0,
                    post.repost_count - 1
                  ),
            };
          }

          if (type === "bookmark") {
            const bookmarked =
              Boolean(result?.bookmarked);

            return {
              ...post,
              bookmarked,
              bookmark_count:
                bookmarked
                  ? post.bookmark_count + 1
                  : Math.max(
                      0,
                      post.bookmark_count - 1
                    ),
            };
          }

          return post;
        };

        return {
          ...current,
          posts: current.posts.map(
            updatePost
          ),
          replies: current.replies.map(
            updatePost
          ),
          reposts: current.reposts.map(
            updatePost
          ),
          likes: current.likes.map(
            updatePost
          ),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete action."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /*
   * Reply.
   */
  async function handleReply(
    event: FormEvent<HTMLFormElement>,
    postId: string,
    body: string
  ) {
    event.preventDefault();

    const cleanBody = body.trim();

    if (!cleanBody) {
      return;
    }

    setReplyLoading(postId);

    try {
      const response = await fetch(
        "/api/posts/reply",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            ...(viewerGuestId
              ? {
                  "x-yourview-guest-id":
                    viewerGuestId,
                }
              : {}),
          },
          body: JSON.stringify({
            post_id: postId,
            body: cleanBody,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to reply."
        );
      }

      /*
       * Refresh profile so the new reply
       * appears in the correct activity tab.
       */
      await reloadProfile();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reply."
      );
    } finally {
      setReplyLoading(null);
    }
  }

  /*
   * Edit own post.
   */
  async function handleEdit(
    event: FormEvent<HTMLFormElement>,
    postId: string,
    body: string
  ) {
    event.preventDefault();

    const cleanBody = body.trim();

    if (!cleanBody) {
      return;
    }

    setEditLoading(postId);

    try {
      const response = await fetch(
        "/api/posts",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            ...(viewerGuestId
              ? {
                  "x-yourview-guest-id":
                    viewerGuestId,
                }
              : {}),
          },
          body: JSON.stringify({
            post_id: postId,
            body: cleanBody,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to edit post."
        );
      }

      await reloadProfile();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to edit post."
      );
    } finally {
      setEditLoading(null);
    }
  }

  /*
   * Reload the currently viewed profile.
   */
  async function reloadProfile() {
    try {
      let url = "/api/profile";

      if (guestParam) {
        url +=
          "?guest=" +
          encodeURIComponent(guestParam);
      } else if (userParam) {
        url +=
          "?user=" +
          encodeURIComponent(userParam);
      }

      const response = await fetch(url, {
        cache: "no-store",
        headers: viewerGuestId
          ? {
              "x-yourview-guest-id":
                viewerGuestId,
            }
          : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to refresh profile."
        );
      }

      setData({
        profile: result.profile,
        posts: Array.isArray(result.posts)
          ? result.posts
          : [],
        replies: Array.isArray(result.replies)
          ? result.replies
          : [],
        reposts: Array.isArray(result.reposts)
          ? result.reposts
          : [],
        likes: Array.isArray(result.likes)
          ? result.likes
          : [],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh profile."
      );
    }
  }

  /*
   * Follow / unfollow.
   */
  async function handleFollow() {
    if (!profile || followLoading) {
      return;
    }

    setFollowLoading(true);
    setError("");

    try {
      const body: {
        following_id?: string;
        following_guest_id?: string;
      } = {};

      if (profile.is_guest) {
        body.following_guest_id =
          profile.id;
      } else {
        body.following_id =
          profile.id;
      }

      const response = await fetch(
        "/api/follows",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            ...(viewerGuestId
              ? {
                  "x-yourview-guest-id":
                    viewerGuestId,
                }
              : {}),
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to update follow."
        );
      }

      setData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          profile: {
            ...current.profile,
            following:
              Boolean(result?.following),
          },
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update follow."
      );
    } finally {
      setFollowLoading(false);
    }
  }

  /*
   * Message another user.
   */
  function handleMessage() {
    if (!profile) {
      return;
    }

    if (profile.is_guest) {
      router.push(
        "/messages?to=" +
          encodeURIComponent(profile.id)
      );
      return;
    }

    router.push(
      "/messages?to=" +
        encodeURIComponent(profile.id)
    );
  }

  /*
   * Share profile.
   */
  async function handleShareProfile() {
    if (!profile) {
      return;
    }

    const url =
      window.location.origin +
      "/profile" +
      (profile.is_guest
        ? "?guest=" +
          encodeURIComponent(
            profile.guest_handle ||
              profile.id
          )
        : "?user=" +
          encodeURIComponent(profile.id));

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            displayName() +
            " on YourView",
          text:
            "View " +
            displayName() +
            "'s profile on YourView.",
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(
        url
      );

      setShareMessage(
        "Profile link copied."
      );

      window.setTimeout(() => {
        setShareMessage("");
      }, 2500);
    } catch {
      // User cancelled native share.
    }
  }

  /*
   * Start editing profile.
   *
   * The UI is prepared here. Saving will be
   * connected to the profile PATCH API next,
   * without changing the existing profile
   * display or activity functionality.
   */
  function openEditProfile() {
    if (!profile) {
      return;
    }

    setEditBio(profile.bio || "");
    setEditCity(profile.city || "");
    setEditCountry(
      profile.country || ""
    );
    setEditDob(
      profile.date_of_birth || ""
    );

    setEditingProfile(true);
  }

  /*
   * Loading.
   */
  if (loading) {
    return (
      <SocialLayout
        guestHandle={null}
        active="profile"
      >
        <section className="feed">
          <div className="feed-header">
            <button
              className="icon-button"
              onClick={() =>
                router.back()
              }
              aria-label="Back"
            >
              <Icon name="arrow-left" />
            </button>

            <div>
              <div className="header-title">
                Profile
              </div>
              <div className="header-subtitle">
                YourView
              </div>
            </div>
          </div>

          <div className="loading-state">
            <div className="spinner" />
            Loading profile...
          </div>
        </section>

        <aside className="right-sidebar">
          <div className="side-card">
            <div className="side-card-title">
              What&apos;s happening
            </div>

            <div className="side-item">
              <span>Stay connected</span>
              <strong>
                Explore YourView
              </strong>
            </div>
          </div>
        </aside>
      </SocialLayout>
    );
  }

  /*
   * Error.
   */
  if (error || !profile || !data) {
    return (
      <SocialLayout
        guestHandle={null}
        active="profile"
      >
        <section className="feed">
          <div className="feed-header">
            <button
              className="icon-button"
              onClick={() =>
                router.back()
              }
              aria-label="Back"
            >
              <Icon name="arrow-left" />
            </button>

            <div>
              <div className="header-title">
                Profile
              </div>
            </div>
          </div>

          <div className="error-banner">
            {error ||
              "Profile could not be loaded."}
          </div>
        </section>

        <aside className="right-sidebar">
          <div className="side-card">
            <div className="side-card-title">
              YourView
            </div>

            <div className="side-item">
              Discover people and
              conversations.
            </div>
          </div>
        </aside>
      </SocialLayout>
    );
  }

  const postsCount =
    profile.posts_count ??
    data.posts.length;

  const followingCount =
    profile.following_count ?? 0;

  const followersCount =
    profile.followers_count ?? 0;

  const location =
    [
      profile.city,
      profile.country,
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <SocialLayout
      guestHandle={
        profile.is_guest
          ? profile.guest_handle
          : null
      }
      active="profile"
    >
      <section className="feed profile-feed">
        {/* Header */}
        <div className="feed-header profile-header">
          <button
            className="icon-button"
            onClick={() =>
              router.back()
            }
            aria-label="Back"
          >
            <Icon name="arrow-left" />
          </button>

          <div className="profile-header-text">
            <div className="header-title">
              Profile
            </div>

            <div className="header-subtitle">
              {postsCount}{" "}
              {postsCount === 1
                ? "post"
                : "posts"}
            </div>
          </div>
        </div>

        {/* Profile top */}
        <div className="profile-cover">
          <div className="profile-avatar">
            {displayName()
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>

        <div className="profile-information">
          {/* Actions */}
          <div className="profile-actions">
            {isOwnProfile ? (
              <>
                <button
                  className="profile-outline-button"
                  onClick={
                    openEditProfile
                  }
                >
                  Edit profile
                </button>

                <button
                  className="profile-icon-action"
                  onClick={
                    handleShareProfile
                  }
                  aria-label="Share profile"
                  title="Share profile"
                >
                  <Icon name="share" />
                </button>
              </>
            ) : (
              <>
                <button
                  className="profile-message-button"
                  onClick={
                    handleMessage
                  }
                >
                  <Icon name="message" />
                  <span>
                    Message
                  </span>
                </button>

                <button
                  className={
                    profile.following
                      ? "profile-following-button"
                      : "profile-follow-button"
                  }
                  onClick={
                    handleFollow
                  }
                  disabled={
                    followLoading
                  }
                >
                  {followLoading
                    ? "..."
                    : profile.following
                    ? "Following"
                    : "Follow"}
                </button>

                <button
                  className="profile-icon-action"
                  onClick={
                    handleShareProfile
                  }
                  aria-label="Share profile"
                  title="Share profile"
                >
                  <Icon name="share" />
                </button>
              </>
            )}
          </div>

          {/* Name */}
          <div className="profile-name-row">
            <h1>
              {displayName()}
            </h1>

            {profile.is_verified &&
              !profile.is_guest && (
                <span
                  className="verified-badge"
                  title="Verified user"
                >
                  ✓
                </span>
              )}
          </div>

          {/* Username */}
          <div className="profile-username">
            @{username()}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="profile-bio">
              {profile.bio}
            </div>
          )}

          {/* Details */}
          <div className="profile-details">
            {location && (
              <span className="profile-detail">
                <Icon name="location" />
                {location}
              </span>
            )}

            {formattedDob() && (
              <span className="profile-detail">
                <Icon name="calendar" />
                Born{" "}
                {formattedDob()}
              </span>
            )}

            {joinedDate() && (
              <span className="profile-detail">
                <Icon name="calendar" />
                Joined{" "}
                {joinedDate()}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <button
              type="button"
              className="profile-stat"
            >
              <strong>
                {followingCount}
              </strong>
              <span>
                Following
              </span>
            </button>

            <button
              type="button"
              className="profile-stat"
            >
              <strong>
                {followersCount}
              </strong>
              <span>
                Followers
              </span>
            </button>

            <button
              type="button"
              className="profile-stat"
            >
              <strong>
                {postsCount}
              </strong>
              <span>
                Posts
              </span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={
              activeTab === "posts"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              setActiveTab("posts")
            }
          >
            Posts
          </button>

          <button
            className={
              activeTab === "replies"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              setActiveTab("replies")
            }
          >
            Replies
          </button>

          <button
            className={
              activeTab === "reposts"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              setActiveTab("reposts")
            }
          >
            Reposts
          </button>

          <button
            className={
              activeTab === "likes"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              setActiveTab("likes")
            }
          >
            Likes
          </button>
        </div>

        {/* Share confirmation */}
        {shareMessage && (
          <div className="share-message">
            {shareMessage}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {/* Activity */}
        {visiblePosts.length === 0 ? (
          <div className="empty-state profile-empty">
            <div className="empty-title">
              {activeTab === "posts" &&
                "No posts yet"}

              {activeTab === "replies" &&
                "No replies yet"}

              {activeTab === "reposts" &&
                "No reposts yet"}

              {activeTab === "likes" &&
                "No likes yet"}
            </div>

            <div className="empty-description">
              {activeTab === "posts" &&
                isOwnProfile &&
                "Your posts will appear here."}

              {activeTab === "posts" &&
                !isOwnProfile &&
                "Posts from this profile will appear here."}

              {activeTab === "replies" &&
                isOwnProfile &&
                "Your replies will appear here."}

              {activeTab === "replies" &&
                !isOwnProfile &&
                "Replies from this profile will appear here."}

              {activeTab === "reposts" &&
                isOwnProfile &&
                "Your reposts will appear here."}

              {activeTab === "reposts" &&
                !isOwnProfile &&
                "Reposts from this profile will appear here."}

              {activeTab === "likes" &&
                isOwnProfile &&
                "Posts you like will appear here."}

              {activeTab === "likes" &&
                !isOwnProfile &&
                "Posts liked by this profile will appear here."}
            </div>
          </div>
        ) : (
          <div className="profile-post-list">
            {visiblePosts.map(
              (post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  guestId={
                    viewerGuestId
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

      {/* Right sidebar */}
      <aside className="right-sidebar">
        <div className="side-card">
          <div className="side-card-title">
            Profile
          </div>

          <div className="profile-side-name">
            {displayName()}
          </div>

          <div className="profile-side-handle">
            @{username()}
          </div>

          <div className="profile-side-stats">
            <div>
              <strong>
                {postsCount}
              </strong>
              <span>
                Posts
              </span>
            </div>

            <div>
              <strong>
                {followersCount}
              </strong>
              <span>
                Followers
              </span>
            </div>

            <div>
              <strong>
                {followingCount}
              </strong>
              <span>
                Following
              </span>
            </div>
          </div>
        </div>

        <div className="side-card">
          <div className="side-card-title">
            YourView
          </div>

          <div className="side-item">
            Connect, post, reply and
            follow people on YourView.
          </div>
        </div>
      </aside>

      {/* Edit profile panel */}
      {editingProfile && (
        <div
          className="edit-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setEditingProfile(false);
            }
          }}
        >
          <div className="edit-profile-modal">
            <div className="edit-profile-header">
              <button
                className="icon-button"
                onClick={() =>
                  setEditingProfile(false)
                }
                aria-label="Close"
              >
                <Icon name="close" />
              </button>

              <strong>
                Edit profile
              </strong>

              <button
                className="save-profile-button"
                onClick={() => {
                  setEditingProfile(false);
                  setError(
                    "Profile saving will be connected to the profile update API next."
                  );
                }}
              >
                Save
              </button>
            </div>

            <div className="edit-profile-body">
              <label>
                Bio
                <textarea
                  value={editBio}
                  onChange={(event) =>
                    setEditBio(
                      event.target.value
                    )
                  }
                  maxLength={160}
                  placeholder="Tell people about yourself"
                />
              </label>

              <label>
                City
                <input
                  value={editCity}
                  onChange={(event) =>
                    setEditCity(
                      event.target.value
                    )
                  }
                  placeholder="City"
                />
              </label>

              <label>
                Country
                <input
                  value={editCountry}
                  onChange={(event) =>
                    setEditCountry(
                      event.target.value
                    )
                  }
                  placeholder="Country"
                />
              </label>

              <label>
                Date of birth
                <input
                  type="date"
                  value={editDob}
                  onChange={(event) =>
                    setEditDob(
                      event.target.value
                    )
                  }
                />
              </label>

              <p className="edit-profile-note">
                Your date of birth is
                optional. Your location
                should contain only your
                city and country.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-feed {
          min-width: 0;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-header-text {
          min-width: 0;
        }

        .header-subtitle {
          color: #71767b;
          font-size: 13px;
          line-height: 18px;
        }

        .profile-cover {
          height: 150px;
          background: #181818;
          border-bottom: 1px solid #2f3336;
          position: relative;
        }

        .profile-avatar {
          position: absolute;
          left: 18px;
          bottom: -54px;
          width: 108px;
          height: 108px;
          border-radius: 50%;
          background: #000;
          border: 4px solid #000;
          box-shadow: 0 0 0 1px #2f3336;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e7e9ea;
          font-size: 42px;
          font-weight: 700;
        }

        .profile-information {
          padding: 14px 18px 18px;
          border-bottom: 1px solid #2f3336;
        }

        .profile-actions {
          min-height: 48px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
        }

        .profile-outline-button,
        .profile-follow-button,
        .profile-following-button,
        .profile-message-button {
          min-height: 38px;
          border-radius: 9999px;
          padding: 0 17px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .profile-outline-button {
          color: #e7e9ea;
          background: transparent;
          border: 1px solid #536471;
        }

        .profile-outline-button:hover {
          background: rgba(239, 243, 244, 0.1);
        }

        .profile-follow-button {
          color: #fff;
          background: #1d9bf0;
          border: 1px solid #1d9bf0;
        }

        .profile-following-button {
          color: #e7e9ea;
          background: transparent;
          border: 1px solid #536471;
        }

        .profile-message-button {
          color: #e7e9ea;
          background: transparent;
          border: 1px solid #536471;
        }

        .profile-follow-button:disabled,
        .profile-following-button:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .profile-icon-action {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid #536471;
          background: transparent;
          color: #e7e9ea;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .profile-icon-action:hover {
          background: rgba(29, 155, 240, 0.1);
          border-color: #1d9bf0;
          color: #1d9bf0;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 3px;
        }

        .profile-name-row h1 {
          margin: 0;
          color: #e7e9ea;
          font-size: 22px;
          line-height: 28px;
          font-weight: 800;
          word-break: break-word;
        }

        .verified-badge {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1d9bf0;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          flex: 0 0 auto;
        }

        .profile-username {
          color: #71767b;
          font-size: 15px;
          line-height: 20px;
          margin-top: 1px;
        }

        .profile-bio {
          color: #e7e9ea;
          font-size: 15px;
          line-height: 21px;
          margin-top: 14px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .profile-details {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 13px;
          color: #71767b;
          font-size: 14px;
        }

        .profile-detail {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .profile-detail svg {
          width: 17px;
          height: 17px;
        }

        .profile-stats {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 14px;
        }

        .profile-stat {
          border: 0;
          padding: 0;
          background: transparent;
          display: inline-flex;
          align-items: baseline;
          gap: 5px;
          cursor: pointer;
          color: #71767b;
        }

        .profile-stat strong {
          color: #e7e9ea;
          font-size: 15px;
          font-weight: 700;
        }

        .profile-stat span {
          font-size: 14px;
        }

        .profile-stat:hover span {
          text-decoration: underline;
        }

        .profile-tabs {
          height: 53px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid #2f3336;
        }

        .profile-tab {
          height: 53px;
          border: 0;
          background: transparent;
          color: #71767b;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
        }

        .profile-tab:hover {
          background: rgba(231, 233, 234, 0.06);
          color: #e7e9ea;
        }

        .profile-tab.active {
          color: #e7e9ea;
        }

        .profile-tab.active::after {
          content: "";
          position: absolute;
          left: 25%;
          right: 25%;
          bottom: 0;
          height: 4px;
          border-radius: 999px;
          background: #1d9bf0;
        }

        .profile-post-list {
          min-width: 0;
        }

        .profile-empty {
          padding: 55px 20px 70px;
          text-align: center;
        }

        .share-message {
          padding: 10px 18px;
          color: #1d9bf0;
          font-size: 14px;
          border-bottom: 1px solid #2f3336;
        }

        .profile-side-name {
          margin-top: 8px;
          color: #e7e9ea;
          font-size: 18px;
          font-weight: 800;
        }

        .profile-side-handle {
          color: #71767b;
          font-size: 14px;
          margin-top: 2px;
        }

        .profile-side-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 18px;
        }

        .profile-side-stats div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .profile-side-stats strong {
          color: #e7e9ea;
          font-size: 16px;
        }

        .profile-side-stats span {
          color: #71767b;
          font-size: 12px;
        }

        .edit-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(91, 112, 131, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .edit-profile-modal {
          width: min(600px, 100%);
          max-height: min(700px, 90vh);
          overflow: auto;
          background: #000;
          border: 1px solid #2f3336;
          border-radius: 16px;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.6);
        }

        .edit-profile-header {
          min-height: 58px;
          padding: 8px 12px;
          display: grid;
          grid-template-columns: 42px 1fr auto;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #2f3336;
          position: sticky;
          top: 0;
          background: #000;
          z-index: 2;
        }

        .edit-profile-header strong {
          color: #e7e9ea;
          font-size: 20px;
        }

        .save-profile-button {
          border: 0;
          border-radius: 9999px;
          background: #e7e9ea;
          color: #000;
          font-weight: 700;
          padding: 9px 17px;
          cursor: pointer;
        }

        .edit-profile-body {
          padding: 20px;
        }

        .edit-profile-body label {
          display: block;
          color: #e7e9ea;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .edit-profile-body input,
        .edit-profile-body textarea {
          width: 100%;
          box-sizing: border-box;
          margin-top: 7px;
          background: #000;
          border: 1px solid #536471;
          border-radius: 6px;
          color: #e7e9ea;
          font: inherit;
          padding: 11px 12px;
          outline: none;
        }

        .edit-profile-body textarea {
          min-height: 100px;
          resize: vertical;
        }

        .edit-profile-body input:focus,
        .edit-profile-body textarea:focus {
          border-color: #1d9bf0;
          box-shadow: 0 0 0 1px #1d9bf0;
        }

        .edit-profile-note {
          color: #71767b;
          font-size: 13px;
          line-height: 19px;
          margin: 4px 0 0;
        }

        @media (max-width: 700px) {
          .profile-cover {
            height: 120px;
          }

          .profile-avatar {
            width: 88px;
            height: 88px;
            bottom: -44px;
            font-size: 34px;
          }

          .profile-information {
            padding-left: 14px;
            padding-right: 14px;
          }

          .profile-actions {
            gap: 6px;
          }

          .profile-outline-button,
          .profile-follow-button,
          .profile-following-button,
          .profile-message-button {
            min-height: 36px;
            padding: 0 12px;
            font-size: 14px;
          }

          .profile-icon-action {
            width: 36px;
            height: 36px;
          }

          .profile-name-row h1 {
            font-size: 20px;
          }

          .profile-stats {
            gap: 14px;
          }

          .profile-tabs {
            overflow-x: auto;
          }

          .profile-tab {
            min-width: 90px;
          }

          .edit-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .edit-profile-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 16px 16px 0 0;
          }
        }
      `}</style>
    </SocialLayout>
  );
}