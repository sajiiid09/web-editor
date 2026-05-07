import { Icons } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { dispatch } from "@designcombo/events";
import { DESIGN_RESIZE, HISTORY_REDO, HISTORY_UNDO } from "@designcombo/state";
import {
	ChevronDown,
	Download,
	ProportionsIcon,
	ShareIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AutosizeInput from "@/components/ui/autosize-input";
import {
	useIsLargeScreen,
	useIsMediumScreen,
	useIsSmallScreen,
} from "@/hooks/use-media-query";
import type StateManager from "@designcombo/state";
import { generateId } from "@designcombo/timeline";
import type { IDesign } from "@designcombo/types";
import { debounce } from "lodash";
import DownloadProgressModal from "./download-progress-modal";
import { useDownloadState } from "./store/use-download-state";

import { LogoIcons } from "@/components/shared/logos";
import Link from "next/link";
import { ENABLE_RESIZE, ENABLE_SHARE } from "./config/features";

export default function Navbar({
	user,
	stateManager,
	setProjectName,
	projectName,
}: {
	user: any | null;
	stateManager: StateManager;
	setProjectName: (name: string) => void;
	projectName: string;
}) {
	const [title, setTitle] = useState(projectName);
	const isLargeScreen = useIsLargeScreen();
	const isMediumScreen = useIsMediumScreen();
	const isSmallScreen = useIsSmallScreen();

	const handleUndo = () => {
		dispatch(HISTORY_UNDO);
	};

	const handleRedo = () => {
		dispatch(HISTORY_REDO);
	};

	// Create a debounced function for setting the project name
	const debouncedSetProjectName = useMemo(
		() => debounce((name: string) => setProjectName(name), 1000),
		[setProjectName],
	);

	// Update the debounced function whenever the title changes
	useEffect(() => {
		debouncedSetProjectName(title);

		return () => {
			debouncedSetProjectName.cancel();
		};
	}, [title, debouncedSetProjectName]);

	useEffect(() => {
		setTitle(projectName);
	}, [projectName]);

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
	};

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: isLargeScreen ? "320px 1fr 320px" : "1fr 1fr 1fr",
			}}
			className="editor-topbar pointer-events-none z-20 flex h-14 items-center border-b border-white/10 px-3"
		>
			<DownloadProgressModal />

			<div className="flex items-center gap-2">
				<div className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-sm ring-1 ring-white/10">
					<LogoIcons.scenify />
				</div>

				<div className="pointer-events-auto flex h-10 items-center gap-1 rounded-full bg-white/[0.055] px-1.5 ring-1 ring-white/10">
					<Button
						onClick={handleUndo}
						className="text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
						variant="ghost"
						size="icon"
					>
						<Icons.undo width={20} />
					</Button>
					<Button
						onClick={handleRedo}
						className="text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
						variant="ghost"
						size="icon"
					>
						<Icons.redo width={20} />
					</Button>
				</div>
			</div>

			<div className="flex h-11 items-center justify-center gap-2">
				{!isSmallScreen && (
					<div className="pointer-events-auto flex h-10 items-center gap-2 rounded-full bg-white/[0.055] px-3 text-muted-foreground ring-1 ring-white/10">
						<AutosizeInput
							name="title"
							value={title}
							onChange={handleTitleChange}
							width={200}
							inputClassName="border-none outline-none px-1 bg-transparent text-center text-[13px] font-semibold tracking-tight text-foreground placeholder:text-muted-foreground"
						/>
					</div>
				)}
			</div>

			<div className="flex h-11 items-center justify-end gap-2">
				<div className="pointer-events-auto flex h-10 items-center gap-2 rounded-full bg-white/[0.055] px-2.5 ring-1 ring-white/10">
					<Link href="https://discord.gg/Jmxsd5f2jp" target="_blank">
						<Button className="h-8 rounded-full border-white/10 bg-white/[0.035] px-3 text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white/10" variant={"outline"}>
							<LogoIcons.discord className="w-6 h-6" />
							<span className="hidden md:block">Join Us</span>
						</Button>
					</Link>
					{ENABLE_SHARE && (
						<Button
							className="flex h-8 gap-1 rounded-full border-white/10 bg-white/[0.035] px-3 text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white/10"
							variant="outline"
							size={isMediumScreen ? "sm" : "icon"}
						>
							<ShareIcon width={18} />{" "}
							<span className="hidden md:block">Share</span>
						</Button>
					)}
					{ENABLE_RESIZE && <ResizeVideo />}
					<DownloadPopover
						stateManager={stateManager}
						projectName={projectName}
					/>
				</div>
			</div>
		</div>
	);
}

const DownloadPopover = ({
	stateManager,
	projectName,
}: {
	stateManager: StateManager;
	projectName: string;
}) => {
	const isMediumScreen = useIsMediumScreen();
	const { actions, exportType } = useDownloadState();
	const [isExportTypeOpen, setIsExportTypeOpen] = useState(false);
	const [open, setOpen] = useState(false);

	const handleExport = () => {
		const data: IDesign = {
			id: generateId(),
			...stateManager.toJSON(),
		};

		actions.setState({ payload: data, projectName });
		actions.startExport();
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					className="flex h-8 gap-1 rounded-full border-white/10 bg-white/[0.035] px-3 text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white/10"
					size={isMediumScreen ? "sm" : "icon"}
				>
					<Download width={18} />{" "}
					<span className="hidden md:block">Export</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="bg-background/90 z-[250] flex w-64 flex-col gap-4 border-white/10 shadow-2xl backdrop-blur-xl"
			>
				<Label>Export settings</Label>

				<Popover open={isExportTypeOpen} onOpenChange={setIsExportTypeOpen}>
					<PopoverTrigger asChild>
						<Button className="w-full justify-between" variant="outline">
							<div>{exportType.toUpperCase()}</div>
							<ChevronDown width={16} />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="bg-background/90 z-[251] w-[--radix-popover-trigger-width] border-white/10 px-2 py-2 shadow-2xl backdrop-blur-xl">
						<div
							className="flex h-8 items-center rounded-lg px-3 text-sm transition-colors hover:cursor-pointer hover:bg-white/10"
							onClick={() => {
								actions.setExportType("mp4");
								setIsExportTypeOpen(false);
							}}
						>
							MP4
						</div>
						<div
							className="flex h-8 items-center rounded-lg px-3 text-sm transition-colors hover:cursor-pointer hover:bg-white/10"
							onClick={() => {
								actions.setExportType("json");
								setIsExportTypeOpen(false);
							}}
						>
							JSON
						</div>
					</PopoverContent>
				</Popover>

				<div>
					<Button onClick={handleExport} className="w-full">
						Export
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};

interface ResizeOptionProps {
	label: string;
	icon: string;
	value: ResizeValue;
	description: string;
}

interface ResizeValue {
	width: number;
	height: number;
	name: string;
}

const RESIZE_OPTIONS: ResizeOptionProps[] = [
	{
		label: "16:9",
		icon: "landscape",
		description: "YouTube ads",
		value: {
			width: 1920,
			height: 1080,
			name: "16:9",
		},
	},
	{
		label: "9:16",
		icon: "portrait",
		description: "TikTok, YouTube Shorts",
		value: {
			width: 1080,
			height: 1920,
			name: "9:16",
		},
	},
	{
		label: "1:1",
		icon: "square",
		description: "Instagram, Facebook posts",
		value: {
			width: 1080,
			height: 1080,
			name: "1:1",
		},
	},
];

const ResizeVideo = () => {
	const handleResize = (options: ResizeValue) => {
		dispatch(DESIGN_RESIZE, {
			payload: {
				...options,
			},
		});
	};
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button className="z-10 h-8 gap-2 rounded-full border-white/10 bg-white/[0.035] px-3 text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white/10" variant="outline" size={"sm"}>
					<ProportionsIcon className="h-4 w-4" />
					<div>Resize</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="z-[250] w-64 border-white/10 bg-background/90 px-2.5 py-3 shadow-2xl backdrop-blur-xl">
				<div className="text-sm">
					{RESIZE_OPTIONS.map((option, index) => (
						<ResizeOption
							key={index}
							label={option.label}
							icon={option.icon}
							value={option.value}
							handleResize={handleResize}
							description={option.description}
						/>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
};

const ResizeOption = ({
	label,
	icon,
	value,
	description,
	handleResize,
}: ResizeOptionProps & { handleResize: (payload: ResizeValue) => void }) => {
	const Icon = Icons[icon as "text"];
	return (
		<div
			onClick={() => handleResize(value)}
			className="flex cursor-pointer items-center rounded-md p-2 hover:bg-zinc-50/10"
		>
			<div className="w-8 text-muted-foreground">
				<Icon size={20} />
			</div>
			<div>
				<div>{label}</div>
				<div className="text-xs text-muted-foreground">{description}</div>
			</div>
		</div>
	);
};
