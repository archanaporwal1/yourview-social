import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createGuestServerClient } from "@/lib/supabase/guest-server";
import { createNotification } from "@/lib/notifications/createNotification";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const followingId =
      typeof body?.following_id === "string"
        ? body.following_id
        : null;

    const followingGuestId =
      typeof body?.following_guest_id === "string"
        ? body.following_guest_id
        : null;

    const guestId =
      request.headers.get(
        "x-yourview-guest-id"
      );

    if (
      !followingId &&
      !followingGuestId
    ) {
      return NextResponse.json(
        {
          error:
            "Following user or guest ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      followingId &&
      followingGuestId
    ) {
      return NextResponse.json(
        {
          error:
            "Provide either following_id or following_guest_id, not both.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------------------
     * GUEST FOLLOW
     * ----------------------------------------------------
     */

    if (guestId) {
      const supabase =
        createGuestServerClient();

      const {
        data: guestSession,
        error: guestError,
      } =
        await supabase
          .from("guest_sessions")
          .select(
            "id, guest_handle"
          )
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
              guestError.message,
          },
          { status: 500 }
        );
      }

      if (!guestSession) {
        return NextResponse.json(
          {
            error:
              "Invalid guest session.",
          },
          { status: 401 }
        );
      }

      if (
        followingGuestId &&
        followingGuestId === guestId
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot follow yourself.",
          },
          { status: 400 }
        );
      }

      const {
        data: targetGuest,
        error: targetGuestError,
      } =
        followingGuestId
          ? await supabase
              .from("guest_sessions")
              .select(
                "id, guest_handle"
              )
              .eq(
                "id",
                followingGuestId
              )
              .maybeSingle()
          : {
              data: null,
              error: null,
            };

      if (targetGuestError) {
        console.error(
          "Target guest lookup error:",
          targetGuestError
        );

        return NextResponse.json(
          {
            error:
              targetGuestError.message,
          },
          { status: 500 }
        );
      }

      if (
        followingGuestId &&
        !targetGuest
      ) {
        return NextResponse.json(
          {
            error:
              "Guest user not found.",
          },
          { status: 404 }
        );
      }

      const {
        data: result,
        error: followError,
      } =
        await supabase.rpc(
          "toggle_follow",
          {
            p_following_id:
              followingId,
            p_following_guest_id:
              followingGuestId,
            p_follower_guest_id:
              guestId,
          }
        );

      if (followError) {
        console.error(
          "toggle_follow guest error:",
          followError
        );

        return NextResponse.json(
          {
            error:
              followError.message ||
              "Unable to update follow.",
          },
          { status: 400 }
        );
      }

      const followResult =
        Array.isArray(result)
          ? result[0]
          : result;

      const following =
        Boolean(
          followResult?.following
        );

      await supabase
        .from("guest_sessions")
        .update({
          last_seen_at:
            new Date().toISOString(),
        })
        .eq("id", guestId);

      /*
       * Create notification only
       * when a new follow is created.
       */

      if (
        following &&
        followingGuestId
      ) {
        await createNotification({
          supabase,

          type: "follow",

          recipientGuestId:
            followingGuestId,

          actorGuestId:
            guestId,
        });
      }

      if (
        following &&
        followingId
      ) {
        await createNotification({
          supabase,

          type: "follow",

          recipientUserId:
            followingId,

          actorGuestId:
            guestId,
        });
      }

      return NextResponse.json({
        following,
      });
    }

    /*
     * ----------------------------------------------------
     * AUTHENTICATED FOLLOW
     * ----------------------------------------------------
     */

    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Please sign in or use guest mode.",
        },
        { status: 401 }
      );
    }

    if (
      followingId &&
      followingId === user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot follow yourself.",
        },
        { status: 400 }
      );
    }

    if (followingGuestId) {
      const {
        data: targetGuest,
        error: targetGuestError,
      } =
        await supabase
          .from("guest_sessions")
          .select(
            "id, guest_handle"
          )
          .eq(
            "id",
            followingGuestId
          )
          .maybeSingle();

      if (targetGuestError) {
        return NextResponse.json(
          {
            error:
              targetGuestError.message,
          },
          { status: 500 }
        );
      }

      if (!targetGuest) {
        return NextResponse.json(
          {
            error:
              "Guest user not found.",
          },
          { status: 404 }
        );
      }
    }

    const {
      data: result,
      error: followError,
    } =
      await supabase.rpc(
        "toggle_follow",
        {
          p_following_id:
            followingId,
          p_following_guest_id:
            followingGuestId,
          p_follower_guest_id:
            null,
        }
      );

    if (followError) {
      console.error(
        "toggle_follow authenticated error:",
        followError
      );

      return NextResponse.json(
        {
          error:
            followError.message ||
            "Unable to update follow.",
        },
        { status: 400 }
      );
    }

    const followResult =
      Array.isArray(result)
        ? result[0]
        : result;

    const following =
      Boolean(
        followResult?.following
      );

    if (
      following &&
      followingGuestId
    ) {
      await createNotification({
        supabase,

        type: "follow",

        recipientGuestId:
          followingGuestId,

        actorUserId:
          user.id,
      });
    }

    if (
      following &&
      followingId
    ) {
      await createNotification({
        supabase,

        type: "follow",

        recipientUserId:
          followingId,

        actorUserId:
          user.id,
      });
    }

    return NextResponse.json({
      following,
    });
  } catch (error) {
    console.error(
      "POST /api/follows error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update follow.",
      },
      { status: 500 }
    );
  }
}