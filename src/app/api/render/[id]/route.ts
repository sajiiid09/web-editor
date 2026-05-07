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

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	try {
		const response = await fetch(`${getRenderApiBaseUrl()}/render/${id}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});

		const data = await readJsonSafely(response);

		if (!response.ok) {
			return NextResponse.json(data, { status: response.status });
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching render status:", error);
		return NextResponse.json(
			{ error: "Failed to fetch render status" },
			{ status: 500 },
		);
	}
}
