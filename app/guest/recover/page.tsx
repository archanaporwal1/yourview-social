"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { recoverGuestSession } from "@/lib/guest/session";

export default function GuestRecoverPage() {
  const router = useRouter();

  const [recoveryCode, setRecoveryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRecover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const code = recoveryCode.trim().toUpperCase();

    if (!code) {
      setError("Please enter your recovery code.");
      return;
    }

    setLoading(true);

    try {
      const session = await recoverGuestSession(code);

      if (!session) {
        setError(
          "Recovery failed. Please check your recovery code and try again."
        );
        return;
      }

      router.push("/guest");
    } catch (err) {
      console.error("Guest recovery error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to recover your guest account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-3xl font-bold tracking-tight"
          >
            YourView
          </Link>

          <p className="mt-2 text-sm text-slate-400">
            Recover your guest account
          </p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">
              Recover Guest Account
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Enter the recovery code you saved when you created your
              YourView guest account.
            </p>
          </div>

          <form onSubmit={handleRecover} className="space-y-5">
            <div>
              <label
                htmlFor="recoveryCode"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Recovery Code
              </label>

              <input
                id="recoveryCode"
                name="recoveryCode"
                type="text"
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
                placeholder="YV-XXXX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={loading}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm tracking-wider text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm leading-5 text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Recovering..." : "Recover Account"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <Link
              href="/guest"
              className="block text-slate-400 transition hover:text-white"
            >
              Back to Guest Mode
            </Link>

            <Link
              href="/auth"
              className="block text-blue-400 transition hover:text-blue-300"
            >
              Sign in or create an account
            </Link>
          </div>
        </section>

        <div className="mt-6 text-center">
          <p className="text-xs leading-5 text-slate-500">
            Your recovery code is used to restore your guest session. Keep
            your recovery code private.
          </p>
        </div>
      </div>
    </main>
  );
}