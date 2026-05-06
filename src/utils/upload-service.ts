import axios from "axios";

export type UploadProgressCallback = (
	uploadId: string,
	progress: number,
) => void;

export type UploadStatusCallback = (
	uploadId: string,
	status: "uploaded" | "failed",
	error?: string,
) => void;

export interface UploadCallbacks {
	onProgress: UploadProgressCallback;
	onStatus: UploadStatusCallback;
}

export interface NormalizedUpload {
	id: string;
	fileName: string;
	filePath?: string;
	fileSize: number;
	contentType: string;
	type: "video" | "image" | "audio" | "document" | "other";
	url: string;
	previewUrl?: string;
	metadata: Record<string, unknown>;
	folder: string | null;
	method: "direct" | "url";
	origin: "user";
	status: "uploaded";
	isPreview: boolean;
}

const getUploadUserId = () => {
	const userId = process.env.NEXT_PUBLIC_MVP_UPLOAD_USER_ID?.trim();

	if (!userId) {
		throw new Error("NEXT_PUBLIC_MVP_UPLOAD_USER_ID is required for uploads.");
	}

	return userId;
};

const getTypeFromContentType = (contentType = ""): NormalizedUpload["type"] => {
	if (contentType.startsWith("video/")) return "video";
	if (contentType.startsWith("image/")) return "image";
	if (contentType.startsWith("audio/")) return "audio";
	if (contentType === "application/pdf") return "document";
	return "other";
};

const getUploadUrl = (
	uploadInfo: Record<string, any>,
	fallbackUrl?: string,
) => {
	return (
		uploadInfo.url ||
		uploadInfo.uploadedUrl ||
		uploadInfo.publicUrl ||
		uploadInfo.originalUrl ||
		fallbackUrl ||
		""
	);
};

const normalizeUpload = ({
	uploadInfo,
	fileSize,
	method,
	fallbackUrl,
}: {
	uploadInfo: Record<string, any>;
	fileSize: number;
	method: "direct" | "url";
	fallbackUrl?: string;
}): NormalizedUpload => {
	const contentType =
		uploadInfo.contentType || uploadInfo.type || "application/octet-stream";
	const url = getUploadUrl(uploadInfo, fallbackUrl);

	if (!url) {
		throw new Error("Upload completed without a usable media URL.");
	}

	return {
		id: String(uploadInfo.id || crypto.randomUUID()),
		fileName:
			uploadInfo.fileName ||
			uploadInfo.name ||
			url.split("/").pop() ||
			"upload",
		filePath: uploadInfo.filePath,
		fileSize,
		contentType,
		type: getTypeFromContentType(contentType),
		url,
		previewUrl: uploadInfo.previewUrl || uploadInfo.thumbnailUrl,
		metadata: {
			...uploadInfo.metadata,
			originalUrl: uploadInfo.originalUrl,
			uploadedUrl: url,
		},
		folder: uploadInfo.folder || null,
		method,
		origin: "user",
		status: "uploaded",
		isPreview: Boolean(uploadInfo.isPreview),
	};
};

export async function processFileUpload(
	uploadId: string,
	file: File,
	callbacks: UploadCallbacks,
): Promise<NormalizedUpload> {
	try {
		const {
			data: { uploads },
		} = await axios.post(
			"/api/uploads/presign",
			{
				userId: getUploadUserId(),
				fileNames: [file.name],
			},
			{
				headers: { "Content-Type": "application/json" },
			},
		);

		const uploadInfo = uploads?.[0];
		if (!uploadInfo?.presignedUrl) {
			throw new Error("Upload service did not return a presigned URL.");
		}

		const uploadResponse = await axios.put(uploadInfo.presignedUrl, file, {
			headers: { "Content-Type": uploadInfo.contentType || file.type },
			onUploadProgress: (progressEvent) => {
				const percent = Math.round(
					(progressEvent.loaded * 100) / (progressEvent.total || 1),
				);
				callbacks.onProgress(uploadId, percent);
			},
			validateStatus: () => true,
		});

		if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
			throw new Error(
				`File upload failed with status ${uploadResponse.status}.`,
			);
		}

		const uploadData = normalizeUpload({
			uploadInfo: {
				...uploadInfo,
				contentType: uploadInfo.contentType || file.type,
				fileName: uploadInfo.fileName || file.name,
			},
			fileSize: file.size,
			method: "direct",
		});

		callbacks.onProgress(uploadId, 100);
		callbacks.onStatus(uploadId, "uploaded");
		return uploadData;
	} catch (error) {
		callbacks.onStatus(uploadId, "failed", (error as Error).message);
		throw error;
	}
}

export async function processUrlUpload(
	uploadId: string,
	url: string,
	callbacks: UploadCallbacks,
): Promise<NormalizedUpload[]> {
	try {
		callbacks.onProgress(uploadId, 10);

		const {
			data: { uploads = [] } = {},
		} = await axios.post(
			"/api/uploads/url",
			{
				userId: getUploadUserId(),
				urls: [url],
			},
			{
				headers: { "Content-Type": "application/json" },
			},
		);

		callbacks.onProgress(uploadId, 50);

		const uploadDataArray = uploads.map((uploadInfo: Record<string, any>) =>
			normalizeUpload({
				uploadInfo,
				fileSize: 0,
				method: "url",
				fallbackUrl: url,
			}),
		);

		if (uploadDataArray.length === 0) {
			throw new Error("Upload service did not return uploaded URL media.");
		}

		callbacks.onProgress(uploadId, 100);
		callbacks.onStatus(uploadId, "uploaded");
		return uploadDataArray;
	} catch (error) {
		callbacks.onStatus(uploadId, "failed", (error as Error).message);
		throw error;
	}
}

export async function processUpload(
	uploadId: string,
	upload: { file?: File; url?: string },
	callbacks: UploadCallbacks,
): Promise<NormalizedUpload | NormalizedUpload[]> {
	if (upload.file) {
		return await processFileUpload(uploadId, upload.file, callbacks);
	}
	if (upload.url) {
		return await processUrlUpload(uploadId, upload.url, callbacks);
	}
	callbacks.onStatus(uploadId, "failed", "No file or URL provided");
	throw new Error("No file or URL provided");
}
