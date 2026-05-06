import { Icons } from "@/components/shared/icons";
import { ENABLE_AI_VOICE, ENABLE_CAPTIONS } from "./config/features";
import { AiVoice } from "./menu-item/ai-voice";
import { Audios } from "./menu-item/audios";
import { Captions } from "./menu-item/captions";
import { Elements } from "./menu-item/elements";
import { Images } from "./menu-item/images";
import { Texts } from "./menu-item/texts";
import { Transitions } from "./menu-item/transitions";
import { Uploads } from "./menu-item/uploads";
import { Videos } from "./menu-item/videos";

export const MENU_ITEMS = [
	{
		id: "uploads",
		icon: Icons.upload,
		label: "Uploads",
		ariaLabel: "Add and manage uploads",
		component: Uploads,
	},
	{
		id: "texts",
		icon: Icons.type,
		label: "Texts",
		ariaLabel: "Add and edit text elements",
		component: Texts,
	},
	{
		id: "videos",
		icon: Icons.video,
		label: "Videos",
		ariaLabel: "Add and manage video content",
		component: Videos,
	},
	...(ENABLE_CAPTIONS
		? [
				{
					id: "captions",
					icon: Icons.captions,
					label: "Captions",
					ariaLabel: "Add and edit captions",
					component: Captions,
				},
			]
		: []),
	{
		id: "images",
		icon: Icons.image,
		label: "Images",
		ariaLabel: "Add and manage images",
		component: Images,
	},
	{
		id: "audios",
		icon: Icons.audio,
		label: "Audio",
		ariaLabel: "Add and manage audio content",
		component: Audios,
	},
	{
		id: "transitions",
		icon: Icons.transition,
		label: "Transitions",
		ariaLabel: "Add transition effects",
		component: Transitions,
	},
	...(ENABLE_AI_VOICE
		? [
				{
					id: "ai-voice",
					icon: Icons.volume,
					label: "AI Voice",
					ariaLabel: "Generate AI voice from text",
					component: AiVoice,
				},
			]
		: []),
	{
		id: "elements",
		icon: Icons.shapes,
		label: "Shapes",
		ariaLabel: "Add shapes and elements",
		component: Elements,
	},
] as const;
