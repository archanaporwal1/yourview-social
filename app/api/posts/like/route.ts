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
     * Find the post owner.
     *
     * A post belongs either to:
     * - an authenticated user
     * - a guest
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
     * GUEST LIKE
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
          "toggle_guest_like",
          {
            p_post_id: postId,
            p_guest_id: guestId,
          }
        );

      if (error) {
        console.error(
          "toggle_guest_like error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to update like.",
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
              "Like operation completed but no result was returned.",
          },
          { status: 500 }
        );
      }

      const liked =
        Boolean(result.liked);

      /*
       * Create notification ONLY when
       * the like was added.
       *
       * No notification is created when
       * the guest removes their like.
       */
      if (liked) {
        await createNotification({
          supabase,
          type: "like",
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
        liked,
        like_count: Number(
          result.like_count ?? 0
        ),
      });
    }

    /*
     * ==========================================
     * AUTHENTICATED USER LIKE
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

    const {
      data: existingLike,
    } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingLike) {
      /*
       * Unlike
       */
      const { error } =
        await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);

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
       * Like
       */
      const { error } =
        await supabase
          .from("likes")
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
       * Create notification ONLY for a
       * newly added like.
       */
      await createNotification({
        supabase,
        type: "like",
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
     * Get current like count.
     */
    const { count } =
      await supabase
        .from("likes")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("post_id", postId);

    return NextResponse.json({
      liked: !existingLike,
      like_count: count ?? 0,
    });
  } catch (error) {
    console.error(
      "POST /api/posts/like error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update like.",
      },
      { status: 500 }
    );
  }
}