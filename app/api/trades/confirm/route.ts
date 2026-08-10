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

  if (typeof tradeId !== "string") {
    return NextResponse.json(
      { error: "Invalid trade." },
      { status: 400 }
    );
  }

  const { data: trade } = await supabase
    .from("trades")
    .select("requester_id, owner_id, status")
    .eq("id", tradeId)
    .single();

  if (!trade) {
    return NextResponse.json(
      { error: "Trade not found." },
      { status: 404 }
    );
  }

  if (
    user.id !== trade.requester_id &&
    user.id !== trade.owner_id
  ) {
    return NextResponse.json(
      { error: "Access denied." },
      { status: 403 }
    );
  }

  if (trade.status !== "active" && trade.status !== "requested") {
    return NextResponse.redirect(
      new URL(`/trades/${tradeId}`, request.url)
    );
  }

  const { error } = await supabase.rpc(
    "confirm_trade",
    {
      target_trade: tradeId,
    }
  );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.redirect(
    new URL(`/trades/${tradeId}`, request.url)
  );
}
