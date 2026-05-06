import ModalUpload from "@/components/modal-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dispatch } from "@designcombo/events";
import { ADD_AUDIO, ADD_IMAGE, ADD_VIDEO } from "@designcombo/state";
import { generateId } from "@designcombo/timeline";
import {
	AlertCircle,
	Image as ImageIcon,
	Loader2,
	Music,
	RotateCcw,
	Trash2,
	UploadIcon,
	Video as VideoIcon,
} from "lucide-react";
import useUploadStore, {
	type NormalizedUpload,
} from "../store/use-upload-store";

const getDisplayName = (upload: NormalizedUpload) =>
	upload.fileName || upload.url;

export const Uploads = () => {
	const {
		setShowUploadModal,
		uploads,
		pendingUploads,
		activeUploads,
		retryUpload,
		removeUpload,
		removeCompletedUpload,
	} = useUploadStore();

	const videos = uploads.filter((upload) => upload.type === "video");
	const images = uploads.filter((upload) => upload.type === "image");
	const audios = uploads.filter((upload) => upload.type === "audio");

	const handleAddVideo = (video: NormalizedUpload) => {
		dispatch(ADD_VIDEO, {
			payload: {
				id: generateId(),
				details: {
					src: video.url,
				},
				metadata: {
					previewUrl:
						video.previewUrl ||
						"https://cdn.designcombo.dev/caption_previews/static_preset1.webp",
				},
			},
			options: {
				resourceId: "main",
				scaleMode: "fit",
			},
		});
	};

	const handleAddImage = (image: NormalizedUpload) => {
		dispatch(ADD_IMAGE, {
			payload: {
				id: generateId(),
				type: "image",
				display: {
					from: 0,
					to: 5000,
				},
				details: {
					src: image.url,
				},
				metadata: {},
			},
			options: {},
		});
	};

	const handleAddAudio = (audio: NormalizedUpload) => {
		dispatch(ADD_AUDIO, {
			payload: {
				id: generateId(),
				type: "audio",
				details: {
					src: audio.url,
				},
				metadata: {},
			},
			options: {},
		});
	};

	const UploadPrompt = () => (
		<div className="flex items-center justify-center px-4">
			<Button
				className="w-full cursor-pointer"
				onClick={() => setShowUploadModal(true)}
			>
				<UploadIcon className="w-4 h-4" />
				<span className="ml-2">Upload</span>
			</Button>
		</div>
	);

	return (
		<div className="flex flex-1 flex-col">
			<div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
				Your uploads
			</div>
			<ModalUpload />
			<UploadPrompt />

			{(pendingUploads.length > 0 || activeUploads.length > 0) && (
				<div className="p-4">
					<div className="font-medium text-sm mb-2 flex items-center gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
						Uploads in Progress
					</div>
					<div className="flex flex-col gap-3">
						{pendingUploads.map((upload) => (
							<div key={upload.id} className="flex items-center gap-2">
								<span className="truncate text-xs flex-1">
									{upload.file?.name || upload.url || "Unknown"}
								</span>
								<span className="text-xs text-muted-foreground">Pending</span>
							</div>
						))}
						{activeUploads.map((upload) => {
							const isFailed = upload.status === "failed";

							return (
								<div key={upload.id} className="flex flex-col gap-1">
									<div className="flex items-center gap-2">
										<span className="truncate text-xs flex-1">
											{upload.file?.name || upload.url || "Unknown"}
										</span>
										{isFailed ? (
											<AlertCircle className="w-3 h-3 text-destructive" />
										) : (
											<Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
										)}
										<span className="text-xs">{upload.progress ?? 0}%</span>
										<span className="text-xs text-muted-foreground">
											{upload.status}
										</span>
									</div>
									{isFailed && (
										<div className="flex items-center gap-2 pl-1">
											<span className="min-w-0 flex-1 truncate text-xs text-destructive">
												{upload.error || "Upload failed"}
											</span>
											<Button
												size="sm"
												variant="outline"
												className="h-6 px-2 text-xs"
												onClick={() => retryUpload(upload.id)}
											>
												<RotateCcw className="mr-1 h-3 w-3" />
												Retry
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="h-6 w-6"
												onClick={() => removeUpload(upload.id)}
												aria-label="Dismiss failed upload"
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			<div className="flex flex-col gap-10 p-4">
				<UploadSection
					title="Videos"
					uploads={videos}
					icon={<VideoIcon className="w-4 h-4 text-muted-foreground" />}
					itemIcon={<VideoIcon className="w-8 h-8 text-muted-foreground" />}
					onAdd={handleAddVideo}
					onRemove={removeCompletedUpload}
				/>

				<UploadSection
					title="Images"
					uploads={images}
					icon={<ImageIcon className="w-4 h-4 text-muted-foreground" />}
					itemIcon={<ImageIcon className="w-8 h-8 text-muted-foreground" />}
					onAdd={handleAddImage}
					onRemove={removeCompletedUpload}
				/>

				<UploadSection
					title="Audios"
					uploads={audios}
					icon={<Music className="w-4 h-4 text-muted-foreground" />}
					itemIcon={<Music className="w-8 h-8 text-muted-foreground" />}
					onAdd={handleAddAudio}
					onRemove={removeCompletedUpload}
				/>
			</div>
		</div>
	);
};

const UploadSection = ({
	title,
	uploads,
	icon,
	itemIcon,
	onAdd,
	onRemove,
}: {
	title: string;
	uploads: NormalizedUpload[];
	icon: React.ReactNode;
	itemIcon: React.ReactNode;
	onAdd: (upload: NormalizedUpload) => void;
	onRemove: (id: string) => void;
}) => {
	if (uploads.length === 0) return null;

	return (
		<div>
			<div className="flex items-center gap-2 mb-2">
				{icon}
				<span className="font-medium text-sm">{title}</span>
			</div>
			<ScrollArea className="max-h-32">
				<div className="grid grid-cols-3 gap-2 max-w-full">
					{uploads.map((upload) => (
						<div
							className="flex items-center gap-2 flex-col w-full"
							key={upload.id}
						>
							<Card
								className="group w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
								onClick={() => onAdd(upload)}
							>
								{upload.type === "image" ? (
									<img
										src={upload.previewUrl || upload.url}
										alt={getDisplayName(upload)}
										className="h-full w-full object-cover"
									/>
								) : (
									itemIcon
								)}
								<Button
									size="icon"
									variant="secondary"
									className="absolute right-1 top-1 h-5 w-5 opacity-0 group-hover:opacity-100"
									onClick={(event) => {
										event.stopPropagation();
										onRemove(upload.id);
									}}
									aria-label={`Remove ${getDisplayName(upload)}`}
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</Card>
							<div className="text-xs text-muted-foreground truncate w-full text-center">
								{getDisplayName(upload)}
							</div>
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
};
