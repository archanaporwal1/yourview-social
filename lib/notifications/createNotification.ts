import type { SupabaseClient } from "@supabase/supabase-js";

type CreateNotificationParams = {
  supabase: SupabaseClient;

  type:
    | "like"
    | "reply"
    | "repost"
    | "follow";

  postId?: string | null;

  recipientUserId?: string | null;
  recipientGuestId?: string | null;

  actorUserId?: string | null;
  actorGuestId?: string | null;
};

export async function createNotification({
  supabase,
  type,
  postId = null,
  recipientUserId = null,
  recipientGuestId = null,
  actorUserId = null,
  actorGuestId = null,
}: CreateNotificationParams) {
  /*
   * A notification must have exactly one recipient:
   *
   * - authenticated user
   * OR
   * - guest session
   */

  const hasRecipientUser =
    Boolean(recipientUserId);

  const hasRecipientGuest =
    Boolean(recipientGuestId);

  if (
    hasRecipientUser ===
    hasRecipientGuest
  ) {
    return {
      success: false,
      skipped: false,
      error:
        "Notification recipient is invalid.",
    };
  }

  /*
   * A notification must also have exactly
   * one actor:
   *
   * - authenticated user
   * OR
   * - guest session
   */

  const hasActorUser =
    Boolean(actorUserId);

  const hasActorGuest =
    Boolean(actorGuestId);

  if (
    hasActorUser ===
    hasActorGuest
  ) {
    return {
      success: false,
      skipped: false,
      error:
        "Notification actor is invalid.",
    };
  }

  /*
   * Do not notify someone about their own action.
   */

  if (
    recipientUserId &&
    actorUserId &&
    recipientUserId === actorUserId
  ) {
    return {
      success: true,
      skipped: true,
    };
  }

  if (
    recipientGuestId &&
    actorGuestId &&
    recipientGuestId === actorGuestId
  ) {
    return {
      success: true,
      skipped: true,
    };
  }

  /*
   * Insert notification.
   */

  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id:
        recipientUserId || null,

      guest_id:
        recipientGuestId || null,

      actor_id:
        actorUserId || null,

      actor_guest_id:
        actorGuestId || null,

      post_id:
        postId || null,

      type,

      is_read: false,
    });

  if (error) {
    console.error(
      "createNotification error:",
      error
    );

    return {
      success: false,
      skipped: false,
      error: error.message,
    };
  }

  return {
    success: true,
    skipped: false,
  };
}