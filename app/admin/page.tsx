"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type GuestSession = {
  id: string;
  guest_handle: string;
  created_at: string;
  last_seen_at: string;
};

type GeneratedRecovery = {
  guest_id: string;
  guest_handle: string;
  recovery_code: string;
  generated_at: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [guests, setGuests] = useState<GuestSession[]>([]);
  const [search, setSearch] = useState("");

  const [selectedGuest, setSelectedGuest] =
    useState<GuestSession | null>(null);

  const [generatedRecovery, setGeneratedRecovery] =
    useState<GeneratedRecovery | null>(null);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_admin");

      if (adminError || isAdmin !== true) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setChecking(false);

      await loadGuests();
    } catch (err) {
      console.error("Admin verification error:", err);
      router.replace("/admin/login");
    }
  }

  async function loadGuests() {
    setLoadingGuests(true);
    setError("");

    try {
      const { data, error: guestError } =
        await supabase
          .from("guest_sessions")
          .select(
            "id, guest_handle, created_at, last_seen_at"
          )
          .order("created_at", {
            ascending: false,
          });

      if (guestError) {
        throw new Error(
          guestError.message
        );
      }

      setGuests(data || []);
    } catch (err) {
      console.error(
        "Guest sessions loading error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to load guest sessions."
        );
      }
    } finally {
      setLoadingGuests(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
      router.replace("/admin/login");
    } catch (err) {
      console.error(
        "Admin logout error:",
        err
      );

      setLoggingOut(false);
    }
  }

  async function generateRecoveryCode(
    guest: GuestSession
  ) {
    setError("");
    setSuccess("");
    setGeneratedRecovery(null);
    setGenerating(true);

    try {
      const { data, error: rpcError } =
        await supabase.rpc(
          "admin_generate_guest_recovery_code",
          {
            p_guest_id: guest.id,
          }
        );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      if (!data || data.length === 0) {
        throw new Error(
          "No recovery code was generated."
        );
      }

      const result =
        data[0] as GeneratedRecovery;

      setSelectedGuest(guest);
      setGeneratedRecovery(result);

      setSuccess(
        "A new recovery code has been generated. Save or give it to the guest now."
      );
    } catch (err) {
      console.error(
        "Recovery code generation error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to generate recovery code."
        );
      }
    } finally {
      setGenerating(false);
    }
  }

  const filteredGuests = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return guests;
    }

    return guests.filter((guest) =>
      guest.guest_handle
        .toLowerCase()
        .includes(query)
    );
  }, [guests, search]);

  function formatDate(value: string) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-slate-400">
            Loading admin dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight"
            >
              YourView
            </Link>

            <p className="text-xs text-slate-500">
              Administration
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
          >
            {loggingOut
              ? "Logging out..."
              : "Admin Logout"}
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-400">
            Manage YourView guest accounts and assist with account recovery.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-900/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
          >
            {success}
          </div>
        )}

        {generatedRecovery && (
          <section className="mb-8 rounded-2xl border border-blue-800/60 bg-blue-950/30 p-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-sm font-medium text-blue-300">
                  New Recovery Code
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Guest:{" "}
                  <span className="font-medium text-white">
                    {generatedRecovery.guest_handle}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-blue-700/50 bg-slate-950 px-6 py-4 text-center">
                <p className="font-mono text-2xl font-bold tracking-[0.2em] text-white">
                  {generatedRecovery.recovery_code}
                </p>
              </div>

            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              This code is displayed only from the current admin session.
              The database stores only its SHA-256 hash. Give this code to the
              guest so they can recover their account.
            </p>

            <button
              onClick={() => {
                setGeneratedRecovery(null);
                setSuccess("");
              }}
              className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Hide Recovery Code
            </button>

          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900">

          <div className="border-b border-slate-800 p-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-xl font-semibold">
                  Guest Sessions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {guests.length} guest account
                  {guests.length === 1 ? "" : "s"}
                </p>
              </div>

              <button
                onClick={loadGuests}
                disabled={loadingGuests}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
              >
                {loadingGuests
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

            </div>

            <div className="mt-5">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search guest handle..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

          </div>

          <div className="divide-y divide-slate-800">

            {loadingGuests ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading guest sessions...
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="p-8 text-center">

                <p className="text-sm text-slate-400">
                  No guest accounts found.
                </p>

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-3 text-sm text-blue-400 hover:text-blue-300"
                  >
                    Clear search
                  </button>
                )}

              </div>
            ) : (
              filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="p-6 transition hover:bg-slate-800/30"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="min-w-0">

                      <p className="font-semibold text-white">
                        {guest.guest_handle}
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-slate-600">
                        {guest.id}
                      </p>

                      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">

                        <div>
                          Created:{" "}
                          <span className="text-slate-400">
                            {formatDate(
                              guest.created_at
                            )}
                          </span>
                        </div>

                        <div>
                          Last seen:{" "}
                          <span className="text-slate-400">
                            {formatDate(
                              guest.last_seen_at
                            )}
                          </span>
                        </div>

                      </div>

                    </div>

                    <button
                      onClick={() =>
                        generateRecoveryCode(
                          guest
                        )
                      }
                      disabled={generating}
                      className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generating &&
                      selectedGuest?.id ===
                        guest.id
                        ? "Generating..."
                        : "Generate Recovery Code"}
                    </button>

                  </div>

                </div>
              ))
            )}

          </div>

        </section>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

          <h3 className="text-sm font-semibold text-slate-300">
            Administrator Security
          </h3>

          <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
            <li>
              • Only accounts listed in admin_users can use the admin recovery function.
            </li>

            <li>
              • Existing recovery codes cannot be viewed by administrators.
            </li>

            <li>
              • Generating a new recovery code replaces the previous recovery code.
            </li>

            <li>
              • The database stores only the recovery-code hash.
            </li>
          </ul>

        </div>

      </div>

    </main>
  );
}