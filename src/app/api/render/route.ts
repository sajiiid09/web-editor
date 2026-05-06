import { NextResponse } from "next/server";

const getRenderApiBaseUrl = () =>
	(process.env.COMBO_API_BASE_URL || "https://api.combo.sh/v1").replace(
		/\/$/,
		"",
	);

const readJsonSafely = async (response: Response) => {
	try {
		return await response.json();
	} catch {
		return { error: response.statusText };
	}
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const response = await fetch(`${getRenderApiBaseUrl()}/render`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		const data = await readJsonSafely(response);

		if (!response.ok) {
			return NextResponse.json(data, { status: response.status });
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("Error initiating render:", error);
		return NextResponse.json(
			{ error: "Failed to initiate render" },
			{ status: 500 },
		);
	}
}
