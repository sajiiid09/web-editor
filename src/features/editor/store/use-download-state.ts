import type { IDesign } from "@designcombo/types";
import { create } from "zustand";

export type ExportType = "json" | "mp4";
export type ExportStatus =
	| "idle"
	| "starting"
	| "processing"
	| "completed"
	| "failed";

interface Output {
	url: string;
	type: ExportType;
	filename: string;
}

interface DownloadState {
	projectId: string;
	exporting: boolean;
	exportType: ExportType;
	progress: number;
	status: ExportStatus;
	error?: string;
	output?: Output;
	payload?: IDesign;
	projectName: string;
	displayProgressModal: boolean;
	actions: {
		setProjectId: (projectId: string) => void;
		setExporting: (exporting: boolean) => void;
		setExportType: (exportType: ExportType) => void;
		setProgress: (progress: number) => void;
		setState: (state: Partial<DownloadState>) => void;
		setOutput: (output: Output) => void;
		startExport: () => void;
		stopWatchingExport: () => void;
		setDisplayProgressModal: (displayProgressModal: boolean) => void;
	};
}

let pollTimeout: ReturnType<typeof setTimeout> | null = null;
let exportRunId = 0;

const stopPolling = () => {
	exportRunId += 1;
	if (pollTimeout) {
		clearTimeout(pollTimeout);
		pollTimeout = null;
	}
};

const sanitizeFilename = (name: string, fallback = "untitled-video") => {
	const sanitized = name
		.trim()
		.replace(/[^a-zA-Z0-9-_ ]+/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase();

	return sanitized || fallback;
};

const getErrorMessage = (error: unknown) => {
	if (error instanceof Error) return error.message;
	return "Export failed. Please try again.";
};

const getRenderUrl = (render: any) =>
	render?.presigned_url ||
	render?.url ||
	render?.output?.url ||
	render?.outputUrl;

const createJsonOutput = (payload: IDesign, projectName: string): Output => {
	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: "application/json",
	});

	return {
		url: URL.createObjectURL(blob),
		type: "json",
		filename: `${sanitizeFilename(projectName)}.json`,
	};
};

export const useDownloadState = create<DownloadState>((set, get) => ({
	projectId: "",
	exporting: false,
	exportType: "mp4",
	progress: 0,
	status: "idle",
	projectName: "Untitled video",
	displayProgressModal: false,
	actions: {
		setProjectId: (projectId) => set({ projectId }),
		setExporting: (exporting) => set({ exporting }),
		setExportType: (exportType) => set({ exportType }),
		setProgress: (progress) => set({ progress }),
		setState: (state) => set({ ...state }),
		setOutput: (output) => set({ output }),
		stopWatchingExport: () => {
			stopPolling();
			set({ exporting: false });
		},
		setDisplayProgressModal: (displayProgressModal) => {
			if (!displayProgressModal) {
				get().actions.stopWatchingExport();
			}
			set({ displayProgressModal });
		},
		startExport: async () => {
			stopPolling();
			const runId = exportRunId;

			try {
				const { payload, exportType, projectName } = get();
				if (!payload) throw new Error("Payload is not defined.");

				set({
					exporting: true,
					displayProgressModal: true,
					status: "starting",
					progress: 0,
					error: undefined,
					output: undefined,
				});

				if (exportType === "json") {
					const output = createJsonOutput(payload, projectName);
					set({
						exporting: false,
						status: "completed",
						progress: 100,
						output,
					});
					return;
				}

				const response = await fetch("/api/render", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						design: payload,
						options: {
							fps: payload.fps || 30,
							size: payload.size,
							format: "mp4",
						},
					}),
				});

				if (!response.ok) {
					const errorBody = await response.json().catch(() => null);
					throw new Error(
						errorBody?.error || "Failed to submit export request.",
					);
				}

				const jobInfo = await response.json();
				const jobId = jobInfo?.render?.id;
				if (!jobId) throw new Error("Render service did not return a job id.");

				set({ status: "processing" });

				const checkStatus = async () => {
					if (runId !== exportRunId) return;

					try {
						const statusResponse = await fetch(`/api/render/${jobId}`, {
							headers: {
								"Content-Type": "application/json",
							},
						});

						if (!statusResponse.ok) {
							const errorBody = await statusResponse.json().catch(() => null);
							throw new Error(
								errorBody?.error || "Failed to fetch export status.",
							);
						}

						const statusInfo = await statusResponse.json();
						const render = statusInfo?.render;
						const status = String(render?.status || "").toUpperCase();
						const progress = Number.isFinite(Number(render?.progress))
							? Number(render.progress)
							: get().progress;

						set({ progress, status: "processing" });

						if (status === "COMPLETED") {
							const url = getRenderUrl(render);
							if (!url)
								throw new Error("Render completed without a download URL.");

							set({
								exporting: false,
								status: "completed",
								progress: 100,
								output: {
									url,
									type: "mp4",
									filename: `${sanitizeFilename(get().projectName)}.mp4`,
								},
							});
							return;
						}

						if (["FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(status)) {
							throw new Error(
								render?.error || `Render ${status.toLowerCase()}.`,
							);
						}

						if (
							["PROCESSING", "PENDING", "QUEUED", "STARTED", ""].includes(
								status,
							)
						) {
							pollTimeout = setTimeout(checkStatus, 2500);
							return;
						}

						throw new Error(`Unexpected render status: ${status}.`);
					} catch (error) {
						if (runId !== exportRunId) return;
						set({
							exporting: false,
							status: "failed",
							error: getErrorMessage(error),
						});
					}
				};

				checkStatus();
			} catch (error) {
				set({
					exporting: false,
					displayProgressModal: true,
					status: "failed",
					error: getErrorMessage(error),
				});
			}
		},
	},
}));
