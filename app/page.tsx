import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * ----------------------------------------------------------
   * LOGGED-IN USER HOME
   * ----------------------------------------------------------
   */

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, bio")
      .eq("id", user.id)
      .maybeSingle();

    const displayName =
      profile?.display_name ||
      profile?.username ||
      user.user_metadata?.full_name ||
      "YourView User";

    const username =
      profile?.username ||
      user.email?.split("@")[0] ||
      "user";

    return (
      <main className="min-h-screen bg-[#f7f7f8] text-black">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="text-2xl font-black tracking-tight"
            >
              YourView
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold hover:bg-gray-200"
              >
                @{username}
              </Link>

              <form action="/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,680px)_260px]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-4">
              <nav className="space-y-1">
                <Link
                  href="/"
                  className="block rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold"
                >
                  Home
                </Link>

                <Link
                  href="/explore"
                  className="block rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Explore
                </Link>

                <Link
                  href="/notifications"
                  className="block rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Notifications
                </Link>

                <Link
                  href="/bookmarks"
                  className="block rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Bookmarks
                </Link>

                <Link
                  href="/profile"
                  className="block rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Profile
                </Link>

                <Link
                  href="/settings"
                  className="block rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Settings
                </Link>
              </nav>
            </div>
          </aside>

          <section>
            <div className="mb-6">
              <h1 className="text-3xl font-black">
                Welcome back, {displayName}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Share your view. Discover other views.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">
                What's your view?
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Start a conversation with the YourView community.
              </p>

              <Link
                href="/post/new"
                className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-sm font-bold text-white hover:bg-gray-800"
              >
                Create Post
              </Link>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="font-bold">Your feed</h2>

              <p className="mt-2 text-sm text-gray-500">
                Your personalized social feed will appear here.
              </p>
            </div>
          </section>

          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="font-bold">Your profile</h2>

              <p className="mt-1 text-sm text-gray-500">
                @{username}
              </p>

              {profile?.bio && (
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {profile.bio}
                </p>
              )}

              <Link
                href="/profile"
                className="mt-5 block rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold hover:bg-gray-50"
              >
                View profile
              </Link>
            </div>
          </aside>
        </div>
      </main>
    );
  }

  /*
   * ----------------------------------------------------------
   * PUBLIC / LOGGED-OUT HOME
   * ----------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-black">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            YourView
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Sign in
            </Link>

            <Link
              href="/auth"
              className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-5 py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
              Your social space
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Share your view.
              <br />
              Discover theirs.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              YourView is a social platform where people can share
              thoughts, conversations, opinions, photos and
              perspectives.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth"
                className="rounded-full bg-black px-7 py-3.5 text-center text-sm font-bold text-white transition hover:bg-gray-800"
              >
                Create your account
              </Link>

              <Link
                href="/guest"
                className="rounded-full border-2 border-gray-300 bg-white px-7 py-3.5 text-center text-sm font-bold text-black transition hover:border-black hover:bg-gray-50"
              >
                Continue as Guest
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              No account is required to try YourView as a guest.
            </p>
          </div>

          <div className="hidden lg:block">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-6 rounded-[3rem] bg-gray-200/60 blur-2xl" />

              <div className="relative space-y-4">
                <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                      YV
                    </div>

                    <div>
                      <p className="font-bold">
                        YourView
                      </p>

                      <p className="text-xs text-gray-400">
                        Just now
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-gray-700">
                    Everyone has a view. YourView gives you a
                    place to share it.
                  </p>

                  <div className="mt-4 flex gap-5 text-sm text-gray-400">
                    <span>♡ 24</span>
                    <span>💬 8</span>
                    <span>↻ 3</span>
                  </div>
                </div>

                <div className="ml-10 rounded-3xl border border-gray-200 bg-white p-5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">
                      GV
                    </div>

                    <div>
                      <p className="font-bold">
                        @guest_A7K3P
                      </p>

                      <p className="text-xs text-gray-400">
                        Guest
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-gray-700">
                    I'm exploring YourView as a guest.
                  </p>

                  <div className="mt-4 flex gap-5 text-sm text-gray-400">
                    <span>♡ 7</span>
                    <span>💬 2</span>
                    <span>↻ 1</span>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xl">
                  <p className="text-sm font-bold">
                    Join the conversation
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Sign in or continue as a guest.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} YourView. Share your view.
        </div>
      </footer>
    </main>
  );
}