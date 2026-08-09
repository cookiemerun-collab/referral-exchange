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

  const listingId = formData.get("listingId");

  if (typeof listingId !== "string") {
    return NextResponse.json(
      {
        error: "Invalid listing.",
      },
      {
        status: 400,
      }
    );
  }

  const { data: tradeId, error } =
    await supabase.rpc(
      "create_trade_request",
      {
        target_listing_id: listingId,
      }
    );

  if (error) {
    const message =
      error.message.toLowerCase();

    if (
      message.includes("own listing")
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot request your own listing.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      message.includes(
        "already have a request"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You already have a request for this listing.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 400,
      }
    );
  }

  if (!tradeId) {
    return NextResponse.json(
      {
        error:
          "The trade could not be created.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.redirect(
    new URL(
      `/trades/${tradeId}`,
      request.url
    )
  );
}
