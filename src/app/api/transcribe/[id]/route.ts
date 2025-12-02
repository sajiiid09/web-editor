import { NextResponse } from "next/server";

const BASE_URL = "https://api.combo.sh/v1";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const response = await fetch(`${BASE_URL}/transcribe/${id}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching transcription status:", error);
        return NextResponse.json(
            { error: "Failed to fetch transcription status" },
            { status: 500 }
        );
    }
}
