import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/createNotification";

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

    /*
     * Find the owner of the post.
     *
     * A post can belong to either:
     * - an authenticated user
     * - a guest session
     */
    const { data: post, error: postError } =
      await supabase
        .from("posts")
        .select("id, user_id, guest_id")
        .eq("id", postId)
        .maybeSingle();

    if (postError) {
      console.error(
        "Post lookup error:",
        postError
      );

      return NextResponse.json(
        {
          error: postError.message,
        },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json(
        {
          error: "Post not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ==========================================
     * GUEST REPOST
     * ==========================================
     */

    if (guestId) {
      const {
        data: guestSession,
        error: guestError,
      } = await supabase
        .from("guest_sessions")
        .select("id, guest_handle")
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

      const { data, error } =
        await supabase.rpc(
          "toggle_guest_repost",
          {
            p_post_id: postId,
            p_guest_id: guestId,
          }
        );

      if (error) {
        console.error(
          "toggle_guest_repost error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to update repost.",
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
              "Repost operation completed but no result was returned.",
          },
          { status: 500 }
        );
      }

      const reposted =
        Boolean(result.reposted);

      /*
       * Notify the post owner only when
       * the repost was actually added.
       */
      if (reposted) {
        await createNotification({
          supabase,
          type: "repost",
          postId,

          recipientUserId:
            post.user_id,

          recipientGuestId:
            post.guest_id,

          actorGuestId:
            guestId,
        });
      }

      /*
       * Update guest activity.
       */
      await supabase
        .from("guest_sessions")
        .update({
          last_seen_at:
            new Date().toISOString(),
        })
        .eq("id", guestId);

      return NextResponse.json({
        reposted,
        repost_count: Number(
          result.repost_count ?? 0
        ),
      });
    }

    /*
     * ==========================================
     * AUTHENTICATED USER REPOST
     * ==========================================
     */

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Please sign in or use guest mode.",
        },
        { status: 401 }
      );
    }

    const { data: existing } =
      await supabase
        .from("reposts")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existing) {
      /*
       * Remove repost.
       */
      const { error } =
        await supabase
          .from("reposts")
          .delete()
          .eq("id", existing.id);

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 500 }
        );
      }
    } else {
      /*
       * Add repost.
       */
      const { error } =
        await supabase
          .from("reposts")
          .insert({
            post_id: postId,
            user_id: user.id,
            guest_id: null,
          });

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 500 }
        );
      }

      /*
       * Create notification only for a
       * newly added repost.
       */
      await createNotification({
        supabase,
        type: "repost",
        postId,

        recipientUserId:
          post.user_id,

        recipientGuestId:
          post.guest_id,

        actorUserId:
          user.id,
      });
    }

    /*
     * Get current repost count.
     */
    const { count } =
      await supabase
        .from("reposts")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("post_id", postId);

    return NextResponse.json({
      reposted: !existing,
      repost_count: count ?? 0,
    });
  } catch (error) {
    console.error(
      "POST /api/posts/repost error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update repost.",
      },
      { status: 500 }
    );
  }
}