import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGuestServerClient } from "@/lib/supabase/guest-server";

export const dynamic = "force-dynamic";

type ActivityPost = {
  id: string;
  body: string;
  media_url: string | null;
  guest_handle: string | null;
  guest_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  like_count: number;
  repost_count: number;
  bookmark_count: number;
  liked: boolean;
  reposted: boolean;
  bookmarked: boolean;
  replies: unknown[];
  reply_count: number;
};

function emptyPost(
  post: any,
  counts?: {
    like_count?: number;
    repost_count?: number;
    bookmark_count?: number;
  }
): ActivityPost {
  return {
    id: post.id,
    body: post.body,
    media_url: post.media_url ?? null,
    guest_handle:
      post.guest_handle ?? null,
    guest_id: post.guest_id ?? null,
    user_id: post.user_id ?? null,
    created_at: post.created_at,
    updated_at: post.updated_at,
    like_count:
      counts?.like_count ?? 0,
    repost_count:
      counts?.repost_count ?? 0,
    bookmark_count:
      counts?.bookmark_count ?? 0,
    liked: false,
    reposted: false,
    bookmarked: false,
    replies: [],
    reply_count: 0,
  };
}

async function enrichPosts(
  supabase: any,
  posts: any[],
  viewerUserId: string | null,
  viewerGuestId: string | null
) {
  if (!posts.length) {
    return [];
  }

  const postIds = posts.map(
    (post) => post.id
  );

  const [
    likesResult,
    repostsResult,
    bookmarksResult,
    repliesResult,
  ] = await Promise.all([
    supabase
      .from("likes")
      .select(
        "post_id,user_id,guest_id"
      )
      .in("post_id", postIds),

    supabase
      .from("reposts")
      .select(
        "post_id,user_id,guest_id"
      )
      .in("post_id", postIds),

    supabase
      .from("bookmarks")
      .select(
        "post_id,user_id,guest_id"
      )
      .in("post_id", postIds),

    supabase
      .from("replies")
      .select(
        "id,post_id,user_id,guest_handle,body,created_at"
      )
      .in("post_id", postIds)
      .order("created_at", {
        ascending: true,
      }),
  ]);

  const likes =
    likesResult.data || [];

  const reposts =
    repostsResult.data || [];

  const bookmarks =
    bookmarksResult.data || [];

  const replies =
    repliesResult.data || [];

  return posts.map((post) => {
    const postLikes =
      likes.filter(
        (item: any) =>
          item.post_id === post.id
      );

    const postReposts =
      reposts.filter(
        (item: any) =>
          item.post_id === post.id
      );

    const postBookmarks =
      bookmarks.filter(
        (item: any) =>
          item.post_id === post.id
      );

    const postReplies =
      replies.filter(
        (item: any) =>
          item.post_id === post.id
      );

    const liked =
      viewerUserId
        ? postLikes.some(
            (item: any) =>
              item.user_id ===
              viewerUserId
          )
        : viewerGuestId
        ? postLikes.some(
            (item: any) =>
              item.guest_id ===
              viewerGuestId
          )
        : false;

    const reposted =
      viewerUserId
        ? postReposts.some(
            (item: any) =>
              item.user_id ===
              viewerUserId
          )
        : viewerGuestId
        ? postReposts.some(
            (item: any) =>
              item.guest_id ===
              viewerGuestId
          )
        : false;

    const bookmarked =
      viewerUserId
        ? postBookmarks.some(
            (item: any) =>
              item.user_id ===
              viewerUserId
          )
        : viewerGuestId
        ? postBookmarks.some(
            (item: any) =>
              item.guest_id ===
              viewerGuestId
          )
        : false;

    return {
      ...emptyPost(post, {
        like_count:
          postLikes.length,
        repost_count:
          postReposts.length,
        bookmark_count:
          postBookmarks.length,
      }),

      liked,
      reposted,
      bookmarked,
      replies: postReplies,
      reply_count:
        postReplies.length,
    };
  });
}

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const requestedGuestId =
      url.searchParams.get(
        "guest"
      );

    const requestedUserId =
      url.searchParams.get(
        "user"
      );

    const guestHeader =
      request.headers.get(
        "x-yourview-guest-id"
      );

    /*
     * ------------------------------------------------------------
     * Determine viewer
     * ------------------------------------------------------------
     */

    const authSupabase =
      await createClient();

    const {
      data: {
        user: authUser,
      },
    } =
      await authSupabase.auth.getUser();

    const viewerUserId =
      authUser?.id || null;

    const viewerGuestId =
      guestHeader || null;

    /*
     * ------------------------------------------------------------
     * REGISTERED USER PROFILE
     * ------------------------------------------------------------
     */

    if (requestedUserId) {
      const { data: profile, error } =
        await authSupabase
          .from("profiles")
          .select(
            "id,username,display_name,bio,city,country,date_of_birth,is_verified,created_at"
          )
          .eq(
            "id",
            requestedUserId
          )
          .maybeSingle();

      if (error) {
        console.error(
          "Registered profile error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error.message,
          },
          {
            status: 500,
          }
        );
      }

      if (!profile) {
        return NextResponse.json(
          {
            error:
              "Profile not found.",
          },
          {
            status: 404,
          }
        );
      }

      let following = false;

      if (
        viewerUserId &&
        viewerUserId !== requestedUserId
      ) {
        const { data } =
          await authSupabase
            .from("follows")
            .select("follower_id")
            .eq(
              "follower_id",
              viewerUserId
            )
            .eq(
              "following_id",
              requestedUserId
            )
            .maybeSingle();

        following =
          Boolean(data);
      } else if (
        viewerGuestId
      ) {
        const { data } =
          await authSupabase
            .from("follows")
            .select(
              "follower_guest_id"
            )
            .eq(
              "follower_guest_id",
              viewerGuestId
            )
            .eq(
              "following_id",
              requestedUserId
            )
            .maybeSingle();

        following =
          Boolean(data);
      }

      const [
        followersResult,
        followingResult,
        postsResult,
      ] = await Promise.all([
        authSupabase
          .from("follows")
          .select(
            "follower_id,follower_guest_id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "following_id",
            requestedUserId
          ),

        authSupabase
          .from("follows")
          .select(
            "following_id,following_guest_id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "follower_id",
            requestedUserId
          ),

        authSupabase
          .from("posts")
          .select(
            "id,body,media_url,user_id,guest_id,guest_handle,created_at,updated_at"
          )
          .eq(
            "user_id",
            requestedUserId
          )
          .is("reply_to", null)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (postsResult.error) {
        return NextResponse.json(
          {
            error:
              postsResult.error
                .message,
          },
          {
            status: 500,
          }
        );
      }

      const posts =
        await enrichPosts(
          authSupabase,
          postsResult.data || [],
          viewerUserId,
          viewerGuestId
        );

      /*
       * Replies
       */

      const {
        data: replyRows,
        error: replyError,
      } = await authSupabase
        .from("replies")
        .select(
          "id,post_id,user_id,guest_handle,body,created_at"
        )
        .eq(
          "user_id",
          requestedUserId
        )
        .order("created_at", {
          ascending: false,
        });

      if (replyError) {
        console.error(
          "Profile replies error:",
          replyError
        );
      }

      /*
       * Reposts
       */

      const {
        data: repostRows,
        error: repostError,
      } = await authSupabase
        .from("reposts")
        .select(
          "post_id,user_id,guest_id,created_at"
        )
        .eq(
          "user_id",
          requestedUserId
        )
        .order("created_at", {
          ascending: false,
        });

      if (repostError) {
        console.error(
          "Profile reposts error:",
          repostError
        );
      }

      const repostPostIds =
        (repostRows || []).map(
          (row: any) =>
            row.post_id
        );

      let repostPosts: ActivityPost[] =
        [];

      if (repostPostIds.length) {
        const { data } =
          await authSupabase
            .from("posts")
            .select(
              "id,body,media_url,user_id,guest_id,guest_handle,created_at,updated_at"
            )
            .in(
              "id",
              repostPostIds
            );

        repostPosts =
          await enrichPosts(
            authSupabase,
            data || [],
            viewerUserId,
            viewerGuestId
          );

        repostPosts =
          repostPostIds
            .map(
              (id: string) =>
                repostPosts.find(
                  (post) =>
                    post.id === id
                )
            )
            .filter(
              Boolean
            ) as ActivityPost[];
      }

      /*
       * Likes
       */

      const {
        data: likeRows,
        error: likeError,
      } = await authSupabase
        .from("likes")
        .select(
          "post_id,user_id,guest_id,created_at"
        )
        .eq(
          "user_id",
          requestedUserId
        )
        .order("created_at", {
          ascending: false,
        });

      if (likeError) {
        console.error(
          "Profile likes error:",
          likeError
        );
      }

      const likePostIds =
        (likeRows || []).map(
          (row: any) =>
            row.post_id
        );

      let likedPosts: ActivityPost[] =
        [];

      if (likePostIds.length) {
        const { data } =
          await authSupabase
            .from("posts")
            .select(
              "id,body,media_url,user_id,guest_id,guest_handle,created_at,updated_at"
            )
            .in(
              "id",
              likePostIds
            );

        likedPosts =
          await enrichPosts(
            authSupabase,
            data || [],
            viewerUserId,
            viewerGuestId
          );

        likedPosts =
          likePostIds
            .map(
              (id: string) =>
                likedPosts.find(
                  (post) =>
                    post.id === id
                )
            )
            .filter(
              Boolean
            ) as ActivityPost[];
      }

      return NextResponse.json({
        profile: {
          type: "user",
          id: profile.id,
          username:
            profile.username ||
            "",
          display_name:
            profile.display_name ||
            profile.username ||
            "User",
          bio:
            profile.bio || "",
          city:
            profile.city || "",
          country:
            profile.country || "",
          date_of_birth:
            profile.date_of_birth ||
            null,
          is_verified:
            profile.is_verified !==
            false,
          created_at:
            profile.created_at,
          following,
          followers_count:
            followersResult.count ||
            0,
          following_count:
            followingResult.count ||
            0,
          post_count:
            posts.length,
        },

        posts,

        replies:
          replyRows || [],

        reposts:
          repostPosts,

        likes:
          likedPosts,
      });
    }

    /*
     * ------------------------------------------------------------
     * GUEST PROFILE
     * ------------------------------------------------------------
     */

    const guestId =
      requestedGuestId ||
      viewerGuestId;

    if (!guestId) {
      return NextResponse.json(
        {
          error:
            "Profile ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const guestSupabase =
      createGuestServerClient();

    const {
      data: guestProfile,
      error: guestError,
    } =
      await guestSupabase
        .from("guest_sessions")
        .select(
          "id,guest_handle,created_at"
        )
        .eq(
          "id",
          guestId
        )
        .maybeSingle();

    if (guestError) {
      console.error(
        "Guest profile error:",
        guestError
      );

      return NextResponse.json(
        {
          error:
            guestError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!guestProfile) {
      return NextResponse.json(
        {
          error:
            "Guest profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    let following = false;

    if (
      viewerGuestId &&
      viewerGuestId !== guestId
    ) {
      const { data } =
        await guestSupabase
          .from("follows")
          .select(
            "follower_guest_id"
          )
          .eq(
            "follower_guest_id",
            viewerGuestId
          )
          .eq(
            "following_guest_id",
            guestId
          )
          .maybeSingle();

      following =
        Boolean(data);
    } else if (
      viewerUserId
    ) {
      const { data } =
        await guestSupabase
          .from("follows")
          .select(
            "follower_id"
          )
          .eq(
            "follower_id",
            viewerUserId
          )
          .eq(
            "following_guest_id",
            guestId
          )
          .maybeSingle();

      following =
        Boolean(data);
    }

    const [
      followersResult,
      followingResult,
      postsResult,
    ] = await Promise.all([
      guestSupabase
        .from("follows")
        .select(
          "follower_id,follower_guest_id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "following_guest_id",
          guestId
        ),

      guestSupabase
        .from("follows")
        .select(
          "following_id,following_guest_id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "follower_guest_id",
          guestId
        ),

      guestSupabase
        .from("posts")
        .select(
          "id,body,media_url,user_id,guest_id,guest_handle,created_at,updated_at"
        )
        .eq(
          "guest_id",
          guestId
        )
        .is("reply_to", null)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (postsResult.error) {
      return NextResponse.json(
        {
          error:
            postsResult.error.message,
        },
        {
          status: 500,
        }
      );
    }

    const posts =
      await enrichPosts(
        guestSupabase,
        postsResult.data || [],
        viewerUserId,
        viewerGuestId
      );

    const {
      data: guestReplyRows,
    } =
      await guestSupabase
        .from("replies")
        .select(
          "id,post_id,user_id,guest_handle,body,created_at"
        )
        .eq(
          "guest_handle",
          guestProfile.guest_handle
        )
        .order("created_at", {
          ascending: false,
        });

    const {
      data: guestRepostRows,
    } =
      await guestSupabase
        .from("reposts")
        .select(
          "post_id,user_id,guest_id,created_at"
        )
        .eq(
          "guest_id",
          guestId
        )
        .order("created_at", {
          ascending: false,
        });

    const guestRepostIds =
      (guestRepostRows || []).map(
        (row: any) =>
          row.post_id
      );

    let repostPosts: ActivityPost[] =
      [];

    if (guestRepostIds.length) {
      const { data } =
        await guestSupabase
          .from("posts")
          .select(
            "id,body,media_url,user_id,guest_id,guest_handle,created_at,updated_at"
          )
          .in(
            "id",
            guestRepostIds
          );

      repostPosts =
        await enrichPosts(
          guestSupabase,
          data || [],
          viewerUserId,
          viewerGuestId
        );

      repostPosts =
        guestRepostIds
          .map(
            (id: string) =>
              repostPosts.find(
                (post) =>
                  post.id === id
              )
          )
          .filter(
            Boolean
          ) as ActivityPost[];
    }

    const {
      data: guestLikeRows,
    } =
      await guestSupabase
        .from("likes")
        .select(
          "post_id,user_id,guest_id,created_at"
        )
        .eq(
          "guest_id",
          guestId
        )
        .order("created_at", {
          ascending: false,
        });

    const guestLikeIds =
      (guestLikeRows || []).map(
        (row: any) =>
          row.post_id
      );

    let likedPosts: ActivityPost[] =
      [];

    if (guestLikeIds.length) {
      const { data } =
        await guestSupabase
          .from("posts")
          .select(
            "id,body,media_url,user_id,guest_id,guest_handle,created_at,updated_at"
          )
          .in(
            "id",
            guestLikeIds
          );

      likedPosts =
        await enrichPosts(
          guestSupabase,
          data || [],
          viewerUserId,
          viewerGuestId
        );

      likedPosts =
        guestLikeIds
          .map(
            (id: string) =>
              likedPosts.find(
                (post) =>
                  post.id === id
              )
          )
          .filter(
            Boolean
          ) as ActivityPost[];
    }

    await guestSupabase
      .from("guest_sessions")
      .update({
        last_seen_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        guestId
      );

    return NextResponse.json({
      profile: {
        type: "guest",
        id: guestProfile.id,
        username:
          guestProfile.guest_handle,
        display_name:
          guestProfile.guest_handle,
        guest_handle:
          guestProfile.guest_handle,
        bio: "",
        city: "",
        country: "",
        date_of_birth: null,
        is_verified: false,
        created_at:
          guestProfile.created_at,
        following,
        followers_count:
          followersResult.count ||
          0,
        following_count:
          followingResult.count ||
          0,
        post_count:
          posts.length,
      },

      posts,

      replies:
        guestReplyRows || [],

      reposts:
        repostPosts,

      likes:
        likedPosts,
    });
  } catch (error) {
    console.error(
      "Profile API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load profile.",
      },
      {
        status: 500,
      }
    );
  }
}