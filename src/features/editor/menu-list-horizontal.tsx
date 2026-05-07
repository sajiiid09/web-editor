import useLayoutStore from "./store/use-layout-store";
import { Icons } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from "@/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { MenuItem } from "./menu-item/menu-item";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { ENABLE_CAPTIONS } from "./config/features";

// Define menu item data structure
interface MenuItemData {
  id: string;
  label: string;
  icon: React.ComponentType<{ width?: number }>;
}

// Menu items configuration
const menuItems: MenuItemData[] = [
  {
    id: "texts",
    label: "Text",
    icon: Icons.type
  },
  {
    id: "videos",
    label: "Video",
    icon: Icons.video
  },
  ...(ENABLE_CAPTIONS
    ? [
        {
          id: "captions",
          label: "Captions",
          icon: Icons.captions
        }
      ]
    : []),
  {
    id: "images",
    label: "Images",
    icon: Icons.image
  },
  {
    id: "audios",
    label: "Audio",
    icon: Icons.audio
  },
  {
    id: "transitions",
    label: "Transitions",
    icon: Icons.transition
  }
];

// Reusable MenuButton component
interface MenuButtonProps {
  item: MenuItemData;
  isActive: boolean;
  onClick: () => void;
}

function MenuButton({ item, isActive, onClick }: MenuButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={isActive ? "default" : "ghost"}
      size={"sm"}
      className="rounded-full px-4 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-foreground"
    >
      {item.label}
    </Button>
  );
}

export default function MenuListHorizontal() {
  const {
    setActiveMenuItem,
    setShowMenuItem,
    activeMenuItem,
    showMenuItem,
    drawerOpen,
    setDrawerOpen
  } = useLayoutStore();

  const isLargeScreen = useIsLargeScreen();

  const handleMenuItemClick = (menuItem: string) => {
    setActiveMenuItem(menuItem as any);
    // Use drawer on mobile, sidebar on desktop
    if (!isLargeScreen) {
      setDrawerOpen(true);
    } else {
      setShowMenuItem(true);
    }
  };

  const isMenuItemActive = (itemId: string) => {
    return (
      (drawerOpen && activeMenuItem === itemId) ||
      (showMenuItem && activeMenuItem === itemId)
    );
  };

  return (
    <>
      <div className="editor-mobile-tools flex h-14 items-center border-t border-white/10 bg-background/70 backdrop-blur-xl">
        <ScrollArea className="w-full px-2">
          <div className="flex min-w-max items-center justify-center gap-2 px-4">
            {menuItems.map((item) => (
              <MenuButton
                key={item.id}
                item={item}
                isActive={isMenuItemActive(item.id)}
                onClick={() => handleMenuItemClick(item.id)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Drawer only on mobile/tablet - conditionally mounted */}
      {!isLargeScreen && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[80vh] min-h-[340px] mt-0 border-white/10 bg-background/90 backdrop-blur-xl">
            <VisuallyHidden>
              <DrawerHeader>
                <DrawerTitle>Menu Options</DrawerTitle>
                <DrawerDescription>
                  Select from available menu options
                </DrawerDescription>
              </DrawerHeader>
            </VisuallyHidden>

            <div className="flex-1">
              <MenuItem />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
