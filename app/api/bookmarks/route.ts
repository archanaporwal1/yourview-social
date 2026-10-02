import { NextResponse } from "next/server";

import { createGuestServerClient } from "@/lib/supabase/guest-server";

export const dynamic = "force-dynamic";

function isUuid(value: string | null) {
  if (!value) return false;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function GET(request: Request) {
  try {
    const guestId =
      request.headers.get(
        "x-yourview-guest-id"
      );

    if (!isUuid(guestId)) {
      return NextResponse.json(
        {
          error:
            "Your guest session is missing or invalid.",
        },
        { status: 401 }
      );
    }

    const supabase =
      createGuestServerClient();

    // Get bookmarked post IDs
    const {
      data: bookmarkRows,
      error: bookmarkError,
    } = await supabase.rpc(
      "get_guest_bookmarks",
      {
        p_guest_id: guestId,
      }
    );

    if (bookmarkError) {
      console.error(
        "get_guest_bookmarks error:",
        bookmarkError
      );

      return NextResponse.json(
        {
          error:
            bookmarkError.message ||
            "Unable to load bookmarks.",
        },
        { status: 500 }
      );
    }

    const rows =
      Array.isArray(bookmarkRows)
        ? bookmarkRows
        : [];

    if (rows.length === 0) {
      return NextResponse.json({
        posts: [],
      });
    }

    const postIds =
      rows.map(
        (row) => row.post_id
      );

    // Load posts
    const {
      data: posts,
      error: postsError,
    } = await supabase
      .from("posts")
      .select(
        "id, body, media_url, guest_handle, guest_id, user_id, created_at, updated_at"
      )
      .in("id", postIds)
      .is("reply_to", null);

    if (postsError) {
      console.error(
        "Load bookmarked posts error:",
        postsError
      );

      return NextResponse.json(
        {
          error:
            postsError.message ||
            "Unable to load bookmarked posts.",
        },
        { status: 500 }
      );
    }

    const postList =
      posts || [];

    const postMap =
      new Map(
        postList.map(
          (post) => [
            post.id,
            post,
          ]
        )
      );

    // ----------------------------------------------------
    // Load counts
    // ----------------------------------------------------

    const [
      likesResult,
      repostsResult,
      bookmarksResult,
      repliesResult,
    ] = await Promise.all([
      supabase
        .from("likes")
        .select(
          "post_id"
        )
        .in(
          "post_id",
          postIds
        ),

      supabase
        .from("reposts")
        .select(
          "post_id"
        )
        .in(
          "post_id",
          postIds
        ),

      supabase
        .from("bookmarks")
        .select(
          "post_id, guest_id, user_id"
        )
        .in(
          "post_id",
          postIds
        ),

      supabase
        .from("replies")
        .select(
          "id, post_id, user_id, guest_handle, body, created_at"
        )
        .in(
          "post_id",
          postIds
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        ),
    ]);

    if (likesResult.error) {
      console.error(
        "Bookmark likes error:",
        likesResult.error
      );
    }

    if (repostsResult.error) {
      console.error(
        "Bookmark reposts error:",
        repostsResult.error
      );
    }

    if (bookmarksResult.error) {
      console.error(
        "Bookmark count error:",
        bookmarksResult.error
      );
    }

    if (repliesResult.error) {
      console.error(
        "Bookmark replies error:",
        repliesResult.error
      );
    }

    const likes =
      likesResult.data || [];

    const reposts =
      repostsResult.data || [];

    const bookmarks =
      bookmarksResult.data || [];

    const replies =
      repliesResult.data || [];

    // ----------------------------------------------------
    // Build PostCard-compatible objects
    // ----------------------------------------------------

    const formattedPosts =
      rows
        .map((bookmark) => {
          const post =
            postMap.get(
              bookmark.post_id
            );

          if (!post) {
            return null;
          }

          const postReplies =
            replies.filter(
              (reply) =>
                reply.post_id ===
                post.id
            );

          const likeCount =
            likes.filter(
              (like) =>
                like.post_id ===
                post.id
            ).length;

          const repostCount =
            reposts.filter(
              (repost) =>
                repost.post_id ===
                post.id
            ).length;

          const bookmarkRowsForPost =
            bookmarks.filter(
              (bookmarkRow) =>
                bookmarkRow.post_id ===
                post.id
            );

          const bookmarkedByGuest =
            bookmarkRowsForPost.some(
              (bookmarkRow) =>
                bookmarkRow.guest_id ===
                guestId
            );

          return {
            id: post.id,
            body: post.body,
            media_url:
              post.media_url,
            guest_handle:
              post.guest_handle,
            guest_id:
              post.guest_id,
            user_id:
              post.user_id,
            created_at:
              post.created_at,
            updated_at:
              post.updated_at,

            like_count:
              likeCount,

            repost_count:
              repostCount,

            bookmark_count:
              bookmarkRowsForPost.length,

            liked: false,

            reposted: false,

            bookmarked:
              bookmarkedByGuest,

            replies:
              postReplies,

            reply_count:
              postReplies.length,

            bookmarked_at:
              bookmark.bookmarked_at,
          };
        })
        .filter(Boolean);

    return NextResponse.json({
      posts:
        formattedPosts,
    });
  } catch (error) {
    console.error(
      "GET /api/bookmarks error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load bookmarks.",
      },
      { status: 500 }
    );
  }
}