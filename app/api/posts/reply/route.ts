import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGuestServerClient } from "@/lib/supabase/guest-server";
import { createNotification } from "@/lib/notifications/createNotification";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const postId =
      typeof body?.post_id === "string"
        ? body.post_id
        : "";

    const replyBody =
      typeof body?.body === "string"
        ? body.body.trim()
        : "";

    const guestId =
      request.headers.get(
        "x-yourview-guest-id"
      );

    if (!postId) {
      return NextResponse.json(
        {
          error: "Post ID is required.",
        },
        { status: 400 }
      );
    }

    if (!replyBody) {
      return NextResponse.json(
        {
          error: "Reply text is required.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * GUEST REPLY
     * ==========================================
     *
     * IMPORTANT:
     * Use the guest server client here.
     *
     * This client does not load the authenticated
     * user's Supabase cookie session.
     */

    if (guestId) {
      const supabase =
        createGuestServerClient();

      /*
       * Validate guest session.
       */
      const {
        data: guestSession,
        error: guestError,
      } = await supabase
        .from("guest_sessions")
        .select("id, guest_handle")
        .eq("id", guestId)
        .maybeSingle();

      if (guestError) {
        console.error(
          "Guest session lookup error:",
          guestError
        );

        return NextResponse.json(
          {
            error:
              guestError.message ||
              "Unable to validate guest session.",
          },
          { status: 500 }
        );
      }

      if (!guestSession) {
        return NextResponse.json(
          {
            error: "Invalid guest session.",
          },
          { status: 401 }
        );
      }

      /*
       * Find the parent post and owner.
       */
      const {
        data: parentPost,
        error: parentError,
      } = await supabase
        .from("posts")
        .select("id, user_id, guest_id")
        .eq("id", postId)
        .maybeSingle();

      if (parentError) {
        console.error(
          "Parent post lookup error:",
          parentError
        );

        return NextResponse.json(
          {
            error: parentError.message,
          },
          { status: 500 }
        );
      }

      if (!parentPost) {
        return NextResponse.json(
          {
            error: "Post not found.",
          },
          { status: 404 }
        );
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

      /*
       * Create the reply.
       */
      const {
        data: reply,
        error,
      } = await supabase
        .from("replies")
        .insert({
          post_id: postId,
          user_id: null,
          guest_handle:
            guestSession.guest_handle,
          body: replyBody,
        })
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
        .single();

      if (error) {
        console.error(
          "Guest reply insert error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to create reply.",
          },
          { status: 500 }
        );
      }

      /*
       * Create notification for the post owner.
       *
       * The helper automatically skips a
       * self-reply.
       */
      await createNotification({
        supabase,
        type: "reply",
        postId,

        recipientUserId:
          parentPost.user_id,

        recipientGuestId:
          parentPost.guest_id,

        actorGuestId:
          guestId,
      });

      /*
       * Get current reply count.
       */
      const { count } =
        await supabase
          .from("replies")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("post_id", postId);

      return NextResponse.json({
        reply,
        reply_count: count || 0,
      });
    }

    /*
     * ==========================================
     * AUTHENTICATED USER REPLY
     * ==========================================
     */

    const supabase =
      await createClient();

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

    /*
     * Find the parent post and owner.
     */
    const {
      data: parentPost,
      error: parentError,
    } = await supabase
      .from("posts")
      .select("id, user_id, guest_id")
      .eq("id", postId)
      .maybeSingle();

    if (parentError) {
      console.error(
        "Parent post lookup error:",
        parentError
      );

      return NextResponse.json(
        {
          error: parentError.message,
        },
        { status: 500 }
      );
    }

    if (!parentPost) {
      return NextResponse.json(
        {
          error: "Post not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Create the reply.
     */
    const {
      data: reply,
      error,
    } = await supabase
      .from("replies")
      .insert({
        post_id: postId,
        user_id: user.id,
        guest_handle: null,
        body: replyBody,
      })
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
      .single();

    if (error) {
      console.error(
        "User reply insert error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to create reply.",
        },
        { status: 500 }
      );
    }

    /*
     * Create notification for the post owner.
     *
     * The helper automatically skips a
     * self-reply.
     */
    await createNotification({
      supabase,
      type: "reply",
      postId,

      recipientUserId:
        parentPost.user_id,

      recipientGuestId:
        parentPost.guest_id,

      actorUserId:
        user.id,
    });

    /*
     * Get current reply count.
     */
    const { count } =
      await supabase
        .from("replies")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("post_id", postId);

    return NextResponse.json({
      reply,
      reply_count: count || 0,
    });
  } catch (error) {
    console.error(
      "POST /api/posts/reply error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create reply.",
      },
      { status: 500 }
    );
  }
}