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
    let message =
      "We couldn't create the trade request.";

    const errorMessage =
      error.message.toLowerCase();

    if (
      errorMessage.includes(
        "own listing"
      )
    ) {
      message =
        "You cannot request your own listing.";
    } else if (
      errorMessage.includes(
        "already have a request"
      )
    ) {
      message =
        "You already requested this listing.";
    } else if (
      errorMessage.includes(
        "no longer open"
      )
    ) {
      message =
        "This listing is no longer open.";
    } else if (
      errorMessage.includes(
        "expired"
      )
    ) {
      message =
        "This listing has expired.";
    } else if (
      errorMessage.includes(
        "event is no longer active"
      )
    ) {
      message =
        "This event is no longer active.";
    }

    return NextResponse.redirect(
      new URL(
        `/listings/${listingId}?error=${encodeURIComponent(
          message
        )}`,
        request.url
      )
    );
  }

  if (!tradeId) {
    return NextResponse.redirect(
      new URL(
        `/listings/${listingId}?error=${encodeURIComponent(
          "The trade could not be created."
        )}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL(
      `/trades/${tradeId}`,
      request.url
    )
  );
}
