import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Get the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Get the listing ID from the request
  const formData = await request.formData();
  const listingId = formData.get("listingId");

  if (typeof listingId !== "string" || !listingId) {
    return NextResponse.json(
      { error: "Missing listingId" },
      { status: 400 }
    );
  }

  // Create the trade request through the protected RPC
  const { data: tradeId, error } = await supabase.rpc(
    "create_trade_request",
    {
      target_listing_id: listingId,
    }
  );

  if (error) {
    console.error("create_trade_request error:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Send the user to the new trade page
  return NextResponse.redirect(
    new URL(`/trades/${tradeId}`, request.url)
  );
}
