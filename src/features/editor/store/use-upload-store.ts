import {
	type NormalizedUpload,
	type UploadCallbacks,
	processUpload,
} from "@/utils/upload-service";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UploadFile {
	id: string;
	file?: File;
	url?: string;
	type?: string;
	status?: "pending" | "uploading" | "uploaded" | "failed";
	progress?: number;
	error?: string;
}

interface IUploadStore {
	showUploadModal: boolean;
	setShowUploadModal: (showUploadModal: boolean) => void;
	uploadProgress: Record<string, number>;
	setUploadProgress: (uploadProgress: Record<string, number>) => void;
	uploadsVideos: NormalizedUpload[];
	setUploadsVideos: (uploadsVideos: NormalizedUpload[]) => void;
	uploadsAudios: NormalizedUpload[];
	setUploadsAudios: (uploadsAudios: NormalizedUpload[]) => void;
	uploadsImages: NormalizedUpload[];
	setUploadsImages: (uploadsImages: NormalizedUpload[]) => void;
	files: UploadFile[];
	setFiles: (
		files: UploadFile[] | ((prev: UploadFile[]) => UploadFile[]),
	) => void;

	pendingUploads: UploadFile[];
	addPendingUploads: (uploads: UploadFile[]) => void;
	clearPendingUploads: () => void;
	activeUploads: UploadFile[];
	processUploads: () => void;
	retryUpload: (id: string) => void;
	updateUploadProgress: (id: string, progress: number) => void;
	setUploadStatus: (
		id: string,
		status: UploadFile["status"],
		error?: string,
	) => void;
	removeUpload: (id: string) => void;
	uploads: NormalizedUpload[];
	setUploads: (
		uploads:
			| NormalizedUpload[]
			| ((prev: NormalizedUpload[]) => NormalizedUpload[]),
	) => void;
	removeCompletedUpload: (id: string) => void;
}

const processingUploadIds = new Set<string>();

const normalizePersistedUpload = (upload: any): NormalizedUpload | null => {
	if (!upload || typeof upload !== "object") return null;

	const url =
		upload.url || upload.metadata?.uploadedUrl || upload.metadata?.originalUrl;
	const contentType = upload.contentType || "application/octet-stream";
	const type = upload.type || contentType.split("/")[0] || "other";

	if (
		!url ||
		!["video", "image", "audio", "document", "other"].includes(type)
	) {
		return null;
	}

	return {
		id: String(upload.id || crypto.randomUUID()),
		fileName:
			upload.fileName || upload.file?.name || url.split("/").pop() || "upload",
		filePath: upload.filePath,
		fileSize: Number(upload.fileSize || 0),
		contentType,
		type,
		url,
		previewUrl: upload.previewUrl,
		metadata: upload.metadata || {},
		folder: upload.folder || null,
		method: upload.method === "url" ? "url" : "direct",
		origin: "user",
		status: "uploaded",
		isPreview: Boolean(upload.isPreview),
	};
};

const useUploadStore = create<IUploadStore>()(
	persist(
		(set, get) => ({
			showUploadModal: false,
			setShowUploadModal: (showUploadModal: boolean) =>
				set({ showUploadModal }),

			uploadProgress: {},
			setUploadProgress: (uploadProgress: Record<string, number>) =>
				set({ uploadProgress }),

			uploadsVideos: [],
			setUploadsVideos: (uploadsVideos: NormalizedUpload[]) =>
				set({ uploadsVideos }),

			uploadsAudios: [],
			setUploadsAudios: (uploadsAudios: NormalizedUpload[]) =>
				set({ uploadsAudios }),

			uploadsImages: [],
			setUploadsImages: (uploadsImages: NormalizedUpload[]) =>
				set({ uploadsImages }),

			files: [],
			setFiles: (
				files: UploadFile[] | ((prev: UploadFile[]) => UploadFile[]),
			) =>
				set((state) => ({
					files:
						typeof files === "function"
							? (files as (prev: UploadFile[]) => UploadFile[])(state.files)
							: files,
				})),

			pendingUploads: [],
			addPendingUploads: (uploads: UploadFile[]) => {
				set((state) => ({
					pendingUploads: [...state.pendingUploads, ...uploads],
				}));
			},
			clearPendingUploads: () => set({ pendingUploads: [] }),

			activeUploads: [],
			processUploads: () => {
				const {
					pendingUploads,
					updateUploadProgress,
					setUploadStatus,
					removeUpload,
					setUploads,
				} = get();

				if (pendingUploads.length > 0) {
					set((state) => ({
						activeUploads: [
							...state.activeUploads,
							...pendingUploads.map((u) => ({
								...u,
								status: "uploading" as const,
								progress: 0,
								error: undefined,
							})),
						],
						pendingUploads: [],
					}));
				}

				const callbacks: UploadCallbacks = {
					onProgress: (uploadId, progress) => {
						updateUploadProgress(uploadId, progress);
					},
					onStatus: (uploadId, status, error) => {
						setUploadStatus(uploadId, status, error);
						if (status === "uploaded") {
							setTimeout(() => removeUpload(uploadId), 1500);
						}
					},
				};

				for (const upload of get().activeUploads.filter(
					(upload) => upload.status === "uploading",
				)) {
					if (processingUploadIds.has(upload.id)) continue;
					processingUploadIds.add(upload.id);

					processUpload(
						upload.id,
						{ file: upload.file, url: upload.url },
						callbacks,
					)
						.then((uploadData) => {
							if (Array.isArray(uploadData)) {
								setUploads((prev) => [...prev, ...uploadData]);
							} else {
								setUploads((prev) => [...prev, uploadData]);
							}
						})
						.catch((error) => {
							console.error("Upload failed:", error);
						})
						.finally(() => {
							processingUploadIds.delete(upload.id);
						});
				}
			},
			retryUpload: (id: string) => {
				const failedUpload = get().activeUploads.find(
					(upload) => upload.id === id && upload.status === "failed",
				);

				if (!failedUpload) return;

				set((state) => ({
					activeUploads: state.activeUploads.filter(
						(upload) => upload.id !== id,
					),
					pendingUploads: [
						...state.pendingUploads,
						{
							...failedUpload,
							status: "pending",
							progress: 0,
							error: undefined,
						},
					],
				}));

				setTimeout(() => get().processUploads(), 0);
			},
			updateUploadProgress: (id: string, progress: number) =>
				set((state) => ({
					activeUploads: state.activeUploads.map((u) =>
						u.id === id ? { ...u, progress } : u,
					),
				})),
			setUploadStatus: (
				id: string,
				status: UploadFile["status"],
				error?: string,
			) =>
				set((state) => ({
					activeUploads: state.activeUploads.map((u) =>
						u.id === id ? { ...u, status, error } : u,
					),
				})),
			removeUpload: (id: string) =>
				set((state) => ({
					activeUploads: state.activeUploads.filter((u) => u.id !== id),
					pendingUploads: state.pendingUploads.filter((u) => u.id !== id),
				})),
			uploads: [],
			setUploads: (
				uploads:
					| NormalizedUpload[]
					| ((prev: NormalizedUpload[]) => NormalizedUpload[]),
			) =>
				set((state) => ({
					uploads:
						typeof uploads === "function"
							? (uploads as (prev: NormalizedUpload[]) => NormalizedUpload[])(
									state.uploads,
								)
							: uploads,
				})),
			removeCompletedUpload: (id: string) =>
				set((state) => ({
					uploads: state.uploads.filter((upload) => upload.id !== id),
				})),
		}),
		{
			name: "upload-store-v1",
			version: 1,
			partialize: (state) => ({ uploads: state.uploads }),
			migrate: (persistedState: any) => ({
				...persistedState,
				uploads: Array.isArray(persistedState?.uploads)
					? persistedState.uploads.map(normalizePersistedUpload).filter(Boolean)
					: [],
			}),
		},
	),
);

export type { UploadFile, NormalizedUpload };
export default useUploadStore;
