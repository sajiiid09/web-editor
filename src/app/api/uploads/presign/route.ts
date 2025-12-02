import { NextResponse } from "next/server";

const BASE_URL = "https://api.combo.sh/v1";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${BASE_URL}/uploads/presign`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error getting presigned URL:", error);
        return NextResponse.json(
            { error: "Failed to get presigned URL" },
            { status: 500 }
        );
    }
}
