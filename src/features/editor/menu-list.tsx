import { memo, useCallback } from "react";
import useLayoutStore from "./store/use-layout-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer";
import { MenuItem } from "./menu-item/menu-item";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { MENU_ITEMS } from "./menu-items-config";

// Memoized menu button component for better performance
const MenuButton = memo<{
  item: (typeof MENU_ITEMS)[number];
  isActive: boolean;
  onClick: (menuItem: string) => void;
}>(({ item, isActive, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(item.id);
  }, [item.id, onClick]);

  const IconComponent = item.icon;

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "editor-sidebar-button relative h-10 w-10 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-sm",
        isActive
          ? "bg-white/15 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_10px_25px_rgba(0,0,0,0.18)]"
          : "text-muted-foreground hover:text-foreground"
      )}
      variant="ghost"
      size="icon"
      aria-label={item.ariaLabel}
      aria-pressed={isActive}
    >
      {IconComponent ? <IconComponent width={16} height={16} /> : null}
    </Button>
  );
});

MenuButton.displayName = "MenuButton";

// Main MenuList component
function MenuList() {
  const {
    setActiveMenuItem,
    setShowMenuItem,
    activeMenuItem,
    showMenuItem,
    drawerOpen,
    setDrawerOpen
  } = useLayoutStore();

  const isLargeScreen = useIsLargeScreen();

  const handleMenuItemClick = useCallback(
    (menuItem: string) => {
      setActiveMenuItem(menuItem as any);
      // Use drawer on mobile, sidebar on desktop
      if (!isLargeScreen) {
        setDrawerOpen(true);
      } else {
        setShowMenuItem(true);
      }
    },
    [isLargeScreen, setActiveMenuItem, setDrawerOpen, setShowMenuItem]
  );

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      setDrawerOpen(open);
    },
    [setDrawerOpen]
  );

  return (
    <>
      <nav
        className="flex w-16 flex-col items-center gap-2 border-r border-white/10 bg-white/[0.025] px-2 py-3"
        role="toolbar"
        aria-label="Editor tools"
      >
        {MENU_ITEMS.map((item) => {
          const isActive =
            (drawerOpen && activeMenuItem === item.id) ||
            (showMenuItem && activeMenuItem === item.id);

          return (
            <MenuButton
              key={item.id}
              item={item}
              isActive={isActive}
              onClick={handleMenuItemClick}
            />
          );
        })}
      </nav>

      {/* Drawer only on mobile/tablet - conditionally mounted */}
      {!isLargeScreen && (
        <Drawer open={drawerOpen} onOpenChange={handleDrawerOpenChange}>
          <DrawerContent className="max-h-[80vh] border-white/10 bg-background/90 backdrop-blur-xl">
            <DrawerHeader>
              <DrawerTitle className="capitalize">{activeMenuItem}</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-auto">
              <MenuItem />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

export default memo(MenuList);
