import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const page = searchParams.get("page") || "1";
    const per_page = searchParams.get("per_page") || "15";

    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: "Pexels API key not configured" },
            { status: 500 }
        );
    }

    const baseUrl = "https://api.pexels.com/videos";
    const endpoint = query ? "/search" : "/popular";
    const url = `${baseUrl}${endpoint}?${searchParams.toString()}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching from Pexels:", error);
        return NextResponse.json(
            { error: "Failed to fetch from Pexels" },
            { status: 500 }
        );
    }
}
