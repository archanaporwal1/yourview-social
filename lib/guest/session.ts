import { createClient } from "@/lib/supabase/client";

const GUEST_STORAGE_KEY =
  "yourview_guest_session";

export type GuestSession = {
  id: string;
  guest_handle: string;
  created_at: string;
  last_seen_at: string | null;
};

function generateGuestHandle() {
  const random = Math.floor(
    10000 + Math.random() * 90000
  );

  return `guest_${random}`;
}

function generateRecoveryCode() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let first = "";
  let second = "";

  for (let i = 0; i < 4; i++) {
    first += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  for (let i = 0; i < 4; i++) {
    second += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return `YV-${first}-${second}`;
}

function saveGuestSession(
  session: GuestSession
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    GUEST_STORAGE_KEY,
    JSON.stringify(session)
  );
}

function readStoredSession(): GuestSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.localStorage.getItem(
      GUEST_STORAGE_KEY
    );

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed.id !== "string" ||
      typeof parsed.guest_handle !==
        "string"
    ) {
      return null;
    }

    return parsed as GuestSession;
  } catch {
    return null;
  }
}

export function getStoredGuestId() {
  const session = readStoredSession();

  return session?.id ?? null;
}

export async function getGuestSession(): Promise<GuestSession | null> {
  const stored = readStoredSession();

  if (!stored) {
    return null;
  }

  const supabase = createClient();

  const {
    data,
    error,
  } = await supabase
    .from("guest_sessions")
    .select(
      `
      id,
      guest_handle,
      created_at,
      last_seen_at
      `
    )
    .eq("id", stored.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Get guest session error:",
      error
    );

    return null;
  }

  if (!data) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        GUEST_STORAGE_KEY
      );
    }

    return null;
  }

  const session =
    data as GuestSession;

  saveGuestSession(session);

  return session;
}

export async function createGuestSession(): Promise<GuestSession> {
  const supabase = createClient();

  const guestHandle =
    generateGuestHandle();

  const {
    data,
    error,
  } = await supabase
    .from("guest_sessions")
    .insert({
      guest_handle: guestHandle,
    })
    .select(
      `
      id,
      guest_handle,
      created_at,
      last_seen_at
      `
    )
    .single();

  if (error) {
    console.error(
      "Create guest session error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to create guest session."
    );
  }

  const session =
    data as GuestSession;

  saveGuestSession(session);

  return session;
}

export async function recoverGuestSession(
  recoveryCode: string
): Promise<GuestSession> {
  const cleanCode = recoveryCode
    .trim()
    .toUpperCase();

  if (!cleanCode) {
    throw new Error(
      "Recovery Code is required."
    );
  }

  const supabase = createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "recover_guest_session",
    {
      p_recovery_code:
        cleanCode,
    }
  );

  if (error) {
    console.error(
      "Recover guest session error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to recover guest session."
    );
  }

  if (!data) {
    throw new Error(
      "Invalid Recovery Code."
    );
  }

  const session =
    data as GuestSession;

  saveGuestSession(session);

  return session;
}

export function clearGuestSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(
    GUEST_STORAGE_KEY
  );
}

export function createRecoveryCode() {
  return generateRecoveryCode();
}