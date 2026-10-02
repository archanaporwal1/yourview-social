import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getGuestId(request: Request): string | null {
  const value = request.headers.get(
    "x-yourview-guest-id"
  );

  if (!value) {
    return null;
  }

  return value.trim() || null;
}

function getDebugError(error: unknown) {
  if (error && typeof error === "object") {
    const supabaseError =
      error as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };

    return {
      message:
        supabaseError.message ||
        "Unknown error",
      details:
        supabaseError.details || null,
      hint:
        supabaseError.hint || null,
      code:
        supabaseError.code || null,
    };
  }

  return {
    message: String(error),
    details: null,
    hint: null,
    code: null,
  };
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const postId =
      typeof body?.post_id === "string"
        ? body.post_id.trim()
        : "";

    const postBody =
      typeof body?.body === "string"
        ? body.body.trim()
        : "";

    const guestId =
      getGuestId(request);


    if (!postId) {
      return NextResponse.json(
        {
          error:
            "post_id is required.",
        },
        {
          status: 400,
        }
      );
    }


    if (!postBody) {
      return NextResponse.json(
        {
          error:
            "Post text is required.",
        },
        {
          status: 400,
        }
      );
    }


    if (postBody.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Post cannot exceed 1000 characters.",
        },
        {
          status: 400,
        }
      );
    }


    if (!guestId) {
      return NextResponse.json(
        {
          error:
            "Guest session not found.",
        },
        {
          status: 401,
        }
      );
    }


    const supabase =
      await createClient();


    const {
      data,
      error,
    } = await supabase.rpc(
      "edit_guest_post",
      {
        p_post_id: postId,
        p_guest_id: guestId,
        p_body: postBody,
      }
    );


    if (error) {
      console.error(
        "========================================"
      );

      console.error(
        "YOURVIEW EDIT POST RPC ERROR"
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "Details:",
        error.details
      );

      console.error(
        "Hint:",
        error.hint
      );

      console.error(
        "Code:",
        error.code
      );

      console.error(
        "========================================"
      );


      const message =
        error.message ||
        "Unable to edit post.";


      if (
        message.includes(
          "Editing time has expired"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Editing time has expired. Posts can only be edited within 5 minutes.",
          },
          {
            status: 403,
          }
        );
      }


      if (
        message.includes(
          "only edit your own post"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "You can only edit your own post.",
          },
          {
            status: 403,
          }
        );
      }


      return NextResponse.json(
        {
          error:
            "Unable to edit post.",
          debug:
            getDebugError(error),
        },
        {
          status: 500,
        }
      );
    }


    return NextResponse.json({
      success: true,
      post: data,
    });

  } catch (error) {
    console.error(
      "YOURVIEW EDIT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to edit post.",
      },
      {
        status: 400,
      }
    );
  }
}