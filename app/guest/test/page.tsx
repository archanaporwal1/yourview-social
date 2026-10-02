"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GuestTestPage() {
  const [result, setResult] = useState("Not tested yet.");
  const [loading, setLoading] = useState(false);

  async function testGuestInsert() {
    setLoading(true);
    setResult("Testing Supabase connection...");

    try {
      const supabase = createClient();

      console.log("TEST: Supabase client created.");

      const testHandle =
        "guest_TEST_" +
        Math.random().toString(36).substring(2, 8);

      console.log("TEST HANDLE:", testHandle);

      const { data, error } = await supabase
        .from("guest_sessions")
        .insert({
          guest_handle: testHandle,
        })
        .select(
          "id, guest_handle, created_at, last_seen_at"
        )
        .single();

      if (error) {
        console.error(
          "SUPABASE TEST FAILED"
        );

        console.error(
          "MESSAGE:",
          error.message
        );

        console.error(
          "DETAILS:",
          error.details
        );

        console.error(
          "HINT:",
          error.hint
        );

        console.error(
          "CODE:",
          error.code
        );

        setResult(
          [
            "FAILED",
            "",
            `Message: ${error.message || "none"}`,
            `Details: ${error.details || "none"}`,
            `Hint: ${error.hint || "none"}`,
            `Code: ${error.code || "none"}`,
          ].join("\n")
        );

        return;
      }

      console.log(
        "SUPABASE TEST SUCCESS:",
        data
      );

      setResult(
        [
          "SUCCESS",
          "",
          `Guest ID: ${data.id}`,
          `Guest Handle: ${data.guest_handle}`,
          `Created: ${data.created_at}`,
        ].join("\n")
      );
    } catch (error) {
      console.error(
        "UNEXPECTED TEST ERROR:",
        error
      );

      setResult(
        `Unexpected error: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">
          YourView Guest Session Test
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          This page tests whether your browser can
          directly create a guest session in Supabase.
        </p>

        <button
          onClick={testGuestInsert}
          disabled={loading}
          className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading
            ? "Testing..."
            : "Test Guest Session"}
        </button>

        <pre className="mt-6 whitespace-pre-wrap rounded-xl bg-gray-100 p-4 text-sm">
          {result}
        </pre>
      </div>
    </main>
  );
}