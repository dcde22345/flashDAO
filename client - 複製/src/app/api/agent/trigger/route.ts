import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const eventData = await req.json();
    
    // Log the received event with formatted output for readability
    console.log("\n==== Event received by Agent ====");
    console.log("Timestamp:", new Date().toLocaleString());
    console.log("Type:", eventData.type || "Unknown type");
    console.log("Payload:", JSON.stringify(eventData, null, 2));
    console.log("=================================\n");
    
    // Return a success response
    return NextResponse.json({ 
      success: true, 
      message: "Event received and recorded by agent."
    });
  } catch (error) {
    console.error("Error while processing event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
