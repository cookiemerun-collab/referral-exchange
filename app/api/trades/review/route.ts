import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth", request.url)
    );
  }

  const formData = await request.formData();

  const tradeId = formData.get("tradeId");
  const reviewedId = formData.get("reviewedId");
  const ratingValue = formData.get("rating");
  const commentValue = formData.get("comment");

  if (
    typeof tradeId !== "string" ||
    typeof reviewedId !== "string" ||
    typeof ratingValue !== "string"
  ) {
    return NextResponse.json(
      {
        error: "Invalid review.",
      },
      {
        status: 400,
      }
    );
  }

  const rating = Number.parseInt(
    ratingValue,
    10
  );

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      {
        error: "Rating must be between 1 and 5.",
      },
      {
        status: 400,
      }
    );
  }

  const comment =
    typeof commentValue === "string"
      ? commentValue.trim()
      : "";

  if (comment.length > 500) {
    return NextResponse.json(
      {
        error:
          "Comment cannot exceed 500 characters.",
      },
      {
        status: 400,
      }
    );
  }

  const { error } = await supabase.rpc(
    "submit_trade_review",
    {
      target_trade: tradeId,
      target_rating: rating,
      target_comment: comment,
      target_reviewed_id: reviewedId,
    }
  );

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 400,
      }
    );
  }

  return NextResponse.redirect(
    new URL(`/trades/${tradeId}`, request.url)
  );
}
