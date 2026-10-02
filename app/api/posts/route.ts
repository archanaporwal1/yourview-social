import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GuestSession = {
  id: string;
  guest_handle: string;
  created_at: string;
  last_seen_at: string;
};

function getGuestId(request: Request) {
  return request.headers.get("x-yourview-guest-id");
}

async function getGuestSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  guestId: string
): Promise<GuestSession | null> {
  const { data, error } = await supabase
    .from("guest_sessions")
    .select("id, guest_handle, created_at, last_seen_at")
    .eq("id", guestId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as GuestSession;
}

async function touchGuestSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  guestId: string
) {
  await supabase
    .from("guest_sessions")
    .update({
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", guestId);
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const guestId = getGuestId(request);

    let guestSession: GuestSession | null = null;

    if (guestId) {
      guestSession = await getGuestSession(supabase, guestId);

      if (!guestSession) {
        return NextResponse.json(
          {
            error: "Invalid guest session.",
          },
          { status: 401 }
        );
      }

      await touchGuestSession(supabase, guestId);
    }

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(
        `
        id,
        user_id,
        guest_handle,
        body,
        media_url,
        reply_to,
        created_at,
        updated_at,
        guest_id
      `
      )
      .is("reply_to", null)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Load posts error:", postsError);

      return NextResponse.json(
        {
          error: postsError.message || "Unable to load posts.",
        },
        { status: 500 }
      );
    }

    const postRows = posts || [];

    if (postRows.length === 0) {
      return NextResponse.json({
        posts: [],
      });
    }

    const postIds = postRows.map((post) => post.id);

    const { data: replies, error: repliesError } = await supabase
      .from("replies")
      .select(
        `
        id,
        post_id,
        user_id,
        guest_handle,
        body,
        created_at
      `
      )
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    if (repliesError) {
      console.error("Load replies error:", repliesError);
    }

    const replyRows = replies || [];

    const postsWithData = await Promise.all(
      postRows.map(async (post) => {
        const postReplies = replyRows.filter(
          (reply) => reply.post_id === post.id
        );

        const { count: likeCount } = await supabase
          .from("likes")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("post_id", post.id);

        const { count: repostCount } = await supabase
          .from("reposts")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("post_id", post.id);

        const { count: bookmarkCount } = await supabase
          .from("bookmarks")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("post_id", post.id);

        let liked = false;
        let reposted = false;
        let bookmarked = false;

        if (guestId) {
          const { data: guestLike } = await supabase
            .from("likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("guest_id", guestId)
            .maybeSingle();

          liked = !!guestLike;

          const { data: guestRepost } = await supabase
            .from("reposts")
            .select("id")
            .eq("post_id", post.id)
            .eq("guest_id", guestId)
            .maybeSingle();

          reposted = !!guestRepost;

          const { data: guestBookmark } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("post_id", post.id)
            .eq("guest_id", guestId)
            .maybeSingle();

          bookmarked = !!guestBookmark;
        } else {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: userLike } = await supabase
              .from("likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle();

            liked = !!userLike;

            const { data: userRepost } = await supabase
              .from("reposts")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle();

            reposted = !!userRepost;

            const { data: userBookmark } = await supabase
              .from("bookmarks")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle();

            bookmarked = !!userBookmark;
          }
        }

        return {
          ...post,
          replies: postReplies,
          reply_count: postReplies.length,
          like_count: likeCount || 0,
          repost_count: repostCount || 0,
          bookmark_count: bookmarkCount || 0,
          liked,
          reposted,
          bookmarked,
        };
      })
    );

    return NextResponse.json({
      posts: postsWithData,
    });
  } catch (error) {
    console.error("GET /api/posts error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load posts.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const body = await request.json();

    const postBody =
      typeof body?.body === "string" ? body.body.trim() : "";

    if (!postBody) {
      return NextResponse.json(
        {
          error: "Post text is required.",
        },
        { status: 400 }
      );
    }

    const guestId = getGuestId(request);

    if (guestId) {
      const guestSession = await getGuestSession(
        supabase,
        guestId
      );

      if (!guestSession) {
        return NextResponse.json(
          {
            error: "Invalid guest session.",
          },
          { status: 401 }
        );
      }

      await touchGuestSession(supabase, guestId);

      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          user_id: null,
          guest_handle: guestSession.guest_handle,
          guest_id: guestSession.id,
          body: postBody,
          media_url: null,
          reply_to: null,
        })
        .select(
          `
          id,
          user_id,
          guest_handle,
          body,
          media_url,
          reply_to,
          created_at,
          updated_at,
          guest_id
        `
        )
        .single();

      if (error) {
        console.error("Guest post insert error:", error);

        return NextResponse.json(
          {
            error: error.message || "Unable to create post.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        post: {
          ...post,
          replies: [],
          reply_count: 0,
          like_count: 0,
          repost_count: 0,
          bookmark_count: 0,
          liked: false,
          reposted: false,
          bookmarked: false,
        },
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please sign in or use guest mode.",
        },
        { status: 401 }
      );
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        guest_handle: null,
        guest_id: null,
        body: postBody,
        media_url: null,
        reply_to: null,
      })
      .select(
        `
        id,
        user_id,
        guest_handle,
        body,
        media_url,
        reply_to,
        created_at,
        updated_at,
        guest_id
      `
      )
      .single();

    if (error) {
      console.error("User post insert error:", error);

      return NextResponse.json(
        {
          error: error.message || "Unable to create post.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      post: {
        ...post,
        replies: [],
        reply_count: 0,
        like_count: 0,
        repost_count: 0,
        bookmark_count: 0,
        liked: false,
        reposted: false,
        bookmarked: false,
      },
    });
  } catch (error) {
    console.error("POST /api/posts error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create post.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const body = await request.json();

    const postId =
      typeof body?.post_id === "string"
        ? body.post_id
        : "";

    const postBody =
      typeof body?.body === "string"
        ? body.body.trim()
        : "";

    if (!postId) {
      return NextResponse.json(
        {
          error: "Post ID is required.",
        },
        { status: 400 }
      );
    }

    if (!postBody) {
      return NextResponse.json(
        {
          error: "Post text is required.",
        },
        { status: 400 }
      );
    }

    const guestId = getGuestId(request);

    if (guestId) {
      const guestSession = await getGuestSession(
        supabase,
        guestId
      );

      if (!guestSession) {
        return NextResponse.json(
          {
            error: "Invalid guest session.",
          },
          { status: 401 }
        );
      }

      await touchGuestSession(supabase, guestId);

      const { data: updatedPost, error } =
        await supabase.rpc("edit_guest_post", {
          p_post_id: postId,
          p_guest_id: guestId,
          p_body: postBody,
        });

      if (error) {
        console.error("Guest edit error:", error);

        return NextResponse.json(
          {
            error: error.message || "Unable to edit post.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        post: {
          ...updatedPost,
        },
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please sign in or use guest mode.",
        },
        { status: 401 }
      );
    }

    const { data: existingPost, error: existingError } =
      await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          error: existingError.message,
        },
        { status: 500 }
      );
    }

    if (!existingPost) {
      return NextResponse.json(
        {
          error: "You can only edit your own post.",
        },
        { status: 403 }
      );
    }

    const createdAt = new Date(existingPost.created_at);
    const fiveMinutes = 5 * 60 * 1000;

    if (Date.now() - createdAt.getTime() > fiveMinutes) {
      return NextResponse.json(
        {
          error: "The 5-minute editing window has expired.",
        },
        { status: 400 }
      );
    }

    const { data: updatedPost, error } = await supabase
      .from("posts")
      .update({
        body: postBody,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      console.error("User edit error:", error);

      return NextResponse.json(
        {
          error: error.message || "Unable to edit post.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      post: updatedPost,
    });
  } catch (error) {
    console.error("PATCH /api/posts error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to edit post.",
      },
      { status: 500 }
    );
  }
}