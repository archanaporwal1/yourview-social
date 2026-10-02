import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const body = await request.json();

    const postId =
      typeof body?.post_id === "string"
        ? body.post_id
        : "";

    const guestId =
      request.headers.get("x-yourview-guest-id");

    if (!postId) {
      return NextResponse.json(
        {
          error: "Post ID is required.",
        },
        { status: 400 }
      );
    }

    if (guestId) {
      const { data: guestSession, error: guestError } =
        await supabase
          .from("guest_sessions")
          .select("id")
          .eq("id", guestId)
          .maybeSingle();

      if (guestError || !guestSession) {
        return NextResponse.json(
          {
            error: "Invalid guest session.",
          },
          { status: 401 }
        );
      }

      const { data, error } = await supabase.rpc(
        "toggle_guest_bookmark",
        {
          p_post_id: postId,
          p_guest_id: guestId,
        }
      );

      if (error) {
        console.error(
          "toggle_guest_bookmark error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to update bookmark.",
          },
          { status: 400 }
        );
      }

      const result = Array.isArray(data)
        ? data[0]
        : data;

      if (!result) {
        return NextResponse.json(
          {
            error:
              "Bookmark operation completed but no result was returned.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        bookmarked: Boolean(result.bookmarked),
        bookmark_count: Number(
          result.bookmark_count ?? 0
        ),
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

    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .insert({
          post_id: postId,
          user_id: user.id,
          guest_id: null,
        });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    const { count } = await supabase
      .from("bookmarks")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("post_id", postId);

    return NextResponse.json({
      bookmarked: !existing,
      bookmark_count: count ?? 0,
    });
  } catch (error) {
    console.error(
      "POST /api/posts/bookmark error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update bookmark.",
      },
      { status: 500 }
    );
  }
}