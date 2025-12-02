import { Icons } from "@/components/shared/icons";
import { Images } from "./menu-item/images";
import { Videos } from "./menu-item/videos";
import { Uploads } from "./menu-item/uploads";
import { Texts } from "./menu-item/texts";
import { Captions } from "./menu-item/captions";
import { Audios } from "./menu-item/audios";
import { Transitions } from "./menu-item/transitions";
import { AiVoice } from "./menu-item/ai-voice";
import { Elements } from "./menu-item/elements";

export const MENU_ITEMS = [
    {
        id: "uploads",
        icon: Icons.upload,
        label: "Uploads",
        ariaLabel: "Add and manage uploads",
        component: Uploads
    },
    {
        id: "texts",
        icon: Icons.type,
        label: "Texts",
        ariaLabel: "Add and edit text elements",
        component: Texts
    },
    {
        id: "videos",
        icon: Icons.video,
        label: "Videos",
        ariaLabel: "Add and manage video content",
        component: Videos
    },
    {
        id: "captions",
        icon: Icons.captions,
        label: "Captions",
        ariaLabel: "Add and edit captions",
        component: Captions
    },
    {
        id: "images",
        icon: Icons.image,
        label: "Images",
        ariaLabel: "Add and manage images",
        component: Images
    },
    {
        id: "audios",
        icon: Icons.audio,
        label: "Audio",
        ariaLabel: "Add and manage audio content",
        component: Audios
    },
    {
        id: "transitions",
        icon: Icons.transition,
        label: "Transitions",
        ariaLabel: "Add transition effects",
        component: Transitions
    },
    {
        id: "ai-voice",
        icon: Icons.volume,
        label: "AI Voice",
        ariaLabel: "Generate AI voice from text",
        component: AiVoice
    },
    {
        id: "elements",
        icon: Icons.shapes,
        label: "Shapes",
        ariaLabel: "Add shapes and elements",
        component: Elements
    }
] as const;
