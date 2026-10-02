import { NextResponse } from "next/server";

import { createGuestServerClient } from "@/lib/supabase/guest-server";

export const dynamic = "force-dynamic";

function isUuid(value: string | null) {
  if (!value) return false;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}


// =========================================================
// GET
//
// /api/messages
//       → inbox
//
// /api/messages?to=GUEST_ID
//       → private conversation
// =========================================================

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const targetGuestId =
      searchParams.get("to");

    const currentGuestId =
      request.headers.get(
        "x-yourview-guest-id"
      );


    if (!isUuid(currentGuestId)) {
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


    // =====================================================
    // INBOX
    // =====================================================

    if (!targetGuestId) {
      const {
        data,
        error,
      } = await supabase.rpc(
        "get_message_inbox",
        {
          p_guest_id:
            currentGuestId,
        }
      );


      if (error) {
        console.error(
          "get_message_inbox error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to load messages.",
          },
          { status: 500 }
        );
      }


      return NextResponse.json(
        data || {
          conversations: [],
        }
      );
    }


    // =====================================================
    // PRIVATE CONVERSATION
    // =====================================================

    if (!isUuid(targetGuestId)) {
      return NextResponse.json(
        {
          error:
            "The selected user is invalid.",
        },
        { status: 400 }
      );
    }


    if (
      currentGuestId === targetGuestId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot message yourself.",
        },
        { status: 400 }
      );
    }


    const {
      data,
      error,
    } = await supabase.rpc(
      "get_private_messages",
      {
        p_current_guest_id:
          currentGuestId,

        p_target_guest_id:
          targetGuestId,
      }
    );


    if (error) {
      console.error(
        "get_private_messages error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to load conversation.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json(
      data
    );
  } catch (error) {
    console.error(
      "GET /api/messages error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load messages.",
      },
      { status: 500 }
    );
  }
}


// =========================================================
// POST PRIVATE MESSAGE
// =========================================================

export async function POST(
  request: Request
) {
  try {
    const currentGuestId =
      request.headers.get(
        "x-yourview-guest-id"
      );


    if (!isUuid(currentGuestId)) {
      return NextResponse.json(
        {
          error:
            "Your guest session is missing or invalid.",
        },
        { status: 401 }
      );
    }


    const body =
      await request.json();


    const targetGuestId =
      typeof body?.to === "string"
        ? body.to
        : null;


    const messageBody =
      typeof body?.body === "string"
        ? body.body.trim()
        : "";


    if (!isUuid(targetGuestId)) {
      return NextResponse.json(
        {
          error:
            "The selected user is invalid.",
        },
        { status: 400 }
      );
    }


    if (
      currentGuestId === targetGuestId
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot message yourself.",
        },
        { status: 400 }
      );
    }


    if (!messageBody) {
      return NextResponse.json(
        {
          error:
            "Message cannot be empty.",
        },
        { status: 400 }
      );
    }


    if (messageBody.length > 5000) {
      return NextResponse.json(
        {
          error:
            "Message is too long. Maximum 5000 characters.",
        },
        { status: 400 }
      );
    }


    const supabase =
      createGuestServerClient();


    const {
      data,
      error,
    } = await supabase.rpc(
      "send_private_message",
      {
        p_sender_guest_id:
          currentGuestId,

        p_receiver_guest_id:
          targetGuestId,

        p_body:
          messageBody,
      }
    );


    if (error) {
      console.error(
        "send_private_message error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to send message.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      ...(data || {}),
    });
  } catch (error) {
    console.error(
      "POST /api/messages error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send message.",
      },
      { status: 500 }
    );
  }
}