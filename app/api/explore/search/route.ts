import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createGuestServerClient } from "@/lib/supabase/guest-server";

export const dynamic = "force-dynamic";

type GuestUser = {
  id: string;
  guest_handle: string;
  created_at: string;
  following: boolean;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = (
      searchParams.get("q") || ""
    ).trim();

    const guestId =
      request.headers.get(
        "x-yourview-guest-id"
      );

    if (!query) {
      return NextResponse.json({
        posts: [],
        users: [],
      });
    }

    /*
     * --------------------------------------------------
     * PEOPLE SEARCH
     * --------------------------------------------------
     *
     * Guest users are searched through the
     * SECURITY DEFINER RPC so guest_sessions RLS
     * does not block the search.
     */

    let users: GuestUser[] = [];

    const peopleClient = guestId
      ? createGuestServerClient()
      : await createClient();

    const {
      data: guestUsers,
      error: guestUsersError,
    } = await peopleClient.rpc(
      "search_guest_users",
      {
        p_query: query,
        p_guest_id: guestId || null,
      }
    );

    if (guestUsersError) {
      console.error(
        "People search RPC error:",
        guestUsersError
      );

      return NextResponse.json(
        {
          error:
            guestUsersError.message ||
            "Unable to search people.",
        },
        { status: 500 }
      );
    }

    users = Array.isArray(guestUsers)
      ? guestUsers
      : [];

    /*
     * --------------------------------------------------
     * POSTS SEARCH
     * --------------------------------------------------
     *
     * Search only ROOT posts.
     * Replies must not appear as separate posts
     * in Explore Top / Latest.
     */

    const postsClient = guestId
      ? createGuestServerClient()
      : await createClient();

    const {
      data: postRows,
      error: postsError,
    } = await postsClient
      .from("posts")
      .select(`
        id,
        body,
        media_url,
        guest_handle,
        guest_id,
        user_id,
        created_at,
        updated_at
      `)
      .is("reply_to", null)
      .ilike("body", `%${query}%`)
      .order("created_at", {
        ascending: false,
      })
      .limit(30);

    if (postsError) {
      console.error(
        "Explore posts search error:",
        postsError
      );

      return NextResponse.json(
        {
          error:
            postsError.message ||
            "Unable to search posts.",
        },
        { status: 500 }
      );
    }

    const rows = postRows || [];

    /*
     * --------------------------------------------------
     * BUILD POST DATA
     * --------------------------------------------------
     */

    const postIds = rows.map(
      (post) => post.id
    );

    let likes: any[] = [];
    let reposts: any[] = [];
    let bookmarks: any[] = [];
    let replies: any[] = [];

    if (postIds.length > 0) {
      const [
        likesResult,
        repostsResult,
        bookmarksResult,
        repliesResult,
      ] = await Promise.all([
        postsClient
          .from("likes")
          .select("*")
          .in("post_id", postIds),

        postsClient
          .from("reposts")
          .select("*")
          .in("post_id", postIds),

        postsClient
          .from("bookmarks")
          .select("*")
          .in("post_id", postIds),

        postsClient
          .from("replies")
          .select("*")
          .in("post_id", postIds)
          .order("created_at", {
            ascending: true,
          }),
      ]);

      if (likesResult.error) {
        console.error(
          "Explore likes error:",
          likesResult.error
        );
      } else {
        likes = likesResult.data || [];
      }

      if (repostsResult.error) {
        console.error(
          "Explore reposts error:",
          repostsResult.error
        );
      } else {
        reposts =
          repostsResult.data || [];
      }

      if (bookmarksResult.error) {
        console.error(
          "Explore bookmarks error:",
          bookmarksResult.error
        );
      } else {
        bookmarks =
          bookmarksResult.data || [];
      }

      if (repliesResult.error) {
        console.error(
          "Explore replies error:",
          repliesResult.error
        );
      } else {
        replies =
          repliesResult.data || [];
      }
    }

    /*
     * --------------------------------------------------
     * CURRENT USER/GUEST ACTION STATE
     * --------------------------------------------------
     */

    let currentUserId: string | null = null;

    if (!guestId) {
      const {
        data: {
          user,
        },
      } = await postsClient.auth.getUser();

      currentUserId =
        user?.id || null;
    }

    const enrichedPosts = rows.map(
      (post) => {
        const postLikes = likes.filter(
          (item) =>
            item.post_id === post.id
        );

        const postReposts =
          reposts.filter(
            (item) =>
              item.post_id === post.id
          );

        const postBookmarks =
          bookmarks.filter(
            (item) =>
              item.post_id === post.id
          );

        const postReplies =
          replies.filter(
            (item) =>
              item.post_id === post.id
          );

        let liked = false;
        let reposted = false;
        let bookmarked = false;

        if (guestId) {
          liked = postLikes.some(
            (item) =>
              item.guest_id === guestId
          );

          reposted =
            postReposts.some(
              (item) =>
                item.guest_id === guestId
            );

          bookmarked =
            postBookmarks.some(
              (item) =>
                item.guest_id === guestId
            );
        } else if (currentUserId) {
          liked = postLikes.some(
            (item) =>
              item.user_id ===
              currentUserId
          );

          reposted =
            postReposts.some(
              (item) =>
                item.user_id ===
                currentUserId
            );

          bookmarked =
            postBookmarks.some(
              (item) =>
                item.user_id ===
                currentUserId
            );
        }

        return {
          id: post.id,
          body: post.body,
          media_url: post.media_url,
          guest_handle:
            post.guest_handle,
          guest_id: post.guest_id,
          user_id: post.user_id,
          created_at: post.created_at,
          updated_at: post.updated_at,

          like_count:
            postLikes.length,

          repost_count:
            postReposts.length,

          bookmark_count:
            postBookmarks.length,

          liked,
          reposted,
          bookmarked,

          replies: postReplies,

          reply_count:
            postReplies.length,
        };
      }
    );

    /*
     * --------------------------------------------------
     * UPDATE GUEST ACTIVITY
     * --------------------------------------------------
     */

    if (guestId) {
      await peopleClient
        .from("guest_sessions")
        .update({
          last_seen_at:
            new Date().toISOString(),
        })
        .eq("id", guestId);
    }

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      posts: enrichedPosts,
      users,
    });
  } catch (error) {
    console.error(
      "GET /api/explore/search error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to search Explore.",
      },
      { status: 500 }
    );
  }
}