"use client";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { dispatch } from "@designcombo/events";
import StateManager, { DESIGN_LOAD } from "@designcombo/state";
import type { IDesign, ITrackItem } from "@designcombo/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";
import { SECONDARY_FONT, SECONDARY_FONT_URL } from "./constants/constants";
import { ControlItem } from "./control-item";
import ControlItemHorizontal from "./control-item-horizontal";
import FloatingControl from "./control-item/floating-controls/floating-control";
import CropModal from "./crop-modal/crop-modal";
import { FONTS } from "./data/fonts";
import useTimelineEvents from "./hooks/use-timeline-events";
import { MenuItem } from "./menu-item";
import MenuList from "./menu-list";
import MenuListHorizontal from "./menu-list-horizontal";
import Navbar from "./navbar";
import {
	DEFAULT_PROJECT_NAME,
	projectRepository,
} from "./projects/project-repository";
import Scene from "./scene";
import { SceneRef } from "./scene/scene.types";
import useDataState from "./store/use-data-state";
import useLayoutStore from "./store/use-layout-store";
import useStore from "./store/use-store";
import Timeline from "./timeline";
import { getCompactFontData, loadFonts } from "./utils/fonts";

const stateManager = new StateManager({
	size: {
		width: 1080,
		height: 1920,
	},
});

const Editor = ({ id }: { tempId?: string; id?: string }) => {
	const router = useRouter();
	const [projectId, setProjectId] = useState<string | null>(id ?? null);
	const [projectName, setProjectName] = useState<string>(DEFAULT_PROJECT_NAME);
	const timelinePanelRef = useRef<ImperativePanelHandle>(null);
	const sceneRef = useRef<SceneRef>(null);
	const { timeline, playerRef } = useStore();
	const { activeIds, trackItemsMap } = useStore();
	const [loaded, setLoaded] = useState(false);
	const [trackItem, setTrackItem] = useState<ITrackItem | null>(null);
	const projectIdRef = useRef<string | null>(id ?? null);
	const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isLoadingProjectRef = useRef(false);
	const {
		setTrackItem: setLayoutTrackItem,
		setFloatingControl,
		setLabelControlItem,
		setTypeControlItem,
	} = useLayoutStore();
	const isLargeScreen = useIsLargeScreen();

	useTimelineEvents();

	const { setCompactFonts, setFonts } = useDataState();

	useEffect(() => {
		projectIdRef.current = projectId;
	}, [projectId]);

	const getCurrentDesign = useCallback(
		(currentProjectId: string): IDesign => ({
			id: currentProjectId,
			...stateManager.toJSON(),
		}),
		[],
	);

	const saveCurrentProjectDesign = useCallback(() => {
		const currentProjectId = projectIdRef.current;
		if (!currentProjectId || isLoadingProjectRef.current) return;

		projectRepository.updateProject(currentProjectId, {
			design: getCurrentDesign(currentProjectId),
		});
	}, [getCurrentDesign]);

	const scheduleAutosave = useCallback(() => {
		if (autosaveTimeoutRef.current) {
			clearTimeout(autosaveTimeoutRef.current);
		}

		autosaveTimeoutRef.current = setTimeout(saveCurrentProjectDesign, 1500);
	}, [saveCurrentProjectDesign]);

	const handleProjectNameChange = useCallback((name: string) => {
		const safeName = name.trim() || DEFAULT_PROJECT_NAME;
		setProjectName(safeName);

		const currentProjectId = projectIdRef.current;
		if (!currentProjectId) return;

		projectRepository.updateProject(currentProjectId, { name: safeName });
	}, []);

	useEffect(() => {
		isLoadingProjectRef.current = true;

		if (id) {
			const savedProject = projectRepository.getProject(id);

			if (savedProject) {
				setProjectId(savedProject.id);
				projectIdRef.current = savedProject.id;
				setProjectName(savedProject.name);
				dispatch(DESIGN_LOAD, { payload: savedProject.design });
			} else {
				const newProject = projectRepository.createProject({
					name: DEFAULT_PROJECT_NAME,
				});
				setProjectId(newProject.id);
				projectIdRef.current = newProject.id;
				setProjectName(newProject.name);
				dispatch(DESIGN_LOAD, { payload: newProject.design });
				router.replace(`/edit/${newProject.id}`);
			}
		} else {
			const newProject = projectRepository.createProject({
				name: DEFAULT_PROJECT_NAME,
			});
			setProjectId(newProject.id);
			projectIdRef.current = newProject.id;
			setProjectName(newProject.name);
			dispatch(DESIGN_LOAD, { payload: newProject.design });
			router.replace(`/edit/${newProject.id}`);
		}

		window.setTimeout(() => {
			isLoadingProjectRef.current = false;
		}, 0);
	}, [id, router]);

	useEffect(() => {
		const stateSubscription = stateManager.subscribe(() => {
			scheduleAutosave();
		});

		return () => {
			stateSubscription.unsubscribe();
			if (autosaveTimeoutRef.current) {
				clearTimeout(autosaveTimeoutRef.current);
			}
			saveCurrentProjectDesign();
		};
	}, [saveCurrentProjectDesign, scheduleAutosave]);

	useEffect(() => {
		setCompactFonts(getCompactFontData(FONTS));
		setFonts(FONTS);
	}, []);

	useEffect(() => {
		loadFonts([
			{
				name: SECONDARY_FONT,
				url: SECONDARY_FONT_URL,
			},
		]);
	}, []);

	useEffect(() => {
		const screenHeight = window.innerHeight;
		const desiredHeight = 300;
		const percentage = (desiredHeight / screenHeight) * 100;
		timelinePanelRef.current?.resize(percentage);
	}, []);

	const handleTimelineResize = () => {
		const timelineContainer = document.getElementById("timeline-container");
		if (!timelineContainer) return;

		timeline?.resize(
			{
				height: timelineContainer.clientHeight - 90,
				width: timelineContainer.clientWidth - 40,
			},
			{
				force: true,
			},
		);

		// Trigger zoom recalculation when timeline is resized
		setTimeout(() => {
			sceneRef.current?.recalculateZoom();
		}, 100);
	};

	useEffect(() => {
		const onResize = () => handleTimelineResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [timeline]);

	useEffect(() => {
		if (activeIds.length === 1) {
			const [id] = activeIds;
			const trackItem = trackItemsMap[id];
			if (trackItem) {
				setTrackItem(trackItem);
				setLayoutTrackItem(trackItem);
			}
		} else {
			setTrackItem(null);
			setLayoutTrackItem(null);
		}
	}, [activeIds, trackItemsMap]);

	useEffect(() => {
		setFloatingControl("");
		setLabelControlItem("");
		setTypeControlItem("");
	}, [isLargeScreen]);

	useEffect(() => {
		setLoaded(true);
	}, []);

	return (
		<div className="flex h-screen w-screen flex-col">
			<Navbar
				projectName={projectName}
				user={null}
				stateManager={stateManager}
				setProjectName={handleProjectNameChange}
			/>
			<div className="flex flex-1">
				{isLargeScreen && (
					<div className="bg-muted  flex flex-none border-r border-border/80 h-[calc(100vh-44px)]">
						<MenuList />
						<MenuItem />
					</div>
				)}
				<ResizablePanelGroup style={{ flex: 1 }} direction="vertical">
					<ResizablePanel className="relative" defaultSize={70}>
						<FloatingControl />
						<div className="flex h-full flex-1">
							{/* Sidebar only on large screens - conditionally mounted */}

							<div
								style={{
									width: "100%",
									height: "100%",
									position: "relative",
									flex: 1,
									overflow: "hidden",
								}}
							>
								<CropModal />
								<Scene ref={sceneRef} stateManager={stateManager} />
							</div>
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel
						className="min-h-[50px]"
						ref={timelinePanelRef}
						defaultSize={30}
						onResize={handleTimelineResize}
					>
						{playerRef && <Timeline stateManager={stateManager} />}
					</ResizablePanel>
					{!isLargeScreen && !trackItem && loaded && <MenuListHorizontal />}
					{!isLargeScreen && trackItem && <ControlItemHorizontal />}
				</ResizablePanelGroup>
				<ControlItem />
			</div>
		</div>
	);
};

export default Editor;
