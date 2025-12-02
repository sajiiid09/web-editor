import useLayoutStore from "../store/use-layout-store";
import { MENU_ITEMS } from "../menu-items-config";
import { useIsLargeScreen } from "@/hooks/use-media-query";

const ActiveMenuItem = () => {
  const { activeMenuItem } = useLayoutStore();

  const activeItem = MENU_ITEMS.find((item) => item.id === activeMenuItem);

  if (activeItem && activeItem.component) {
    const Component = activeItem.component;
    return <Component />;
  }

  return null;
};

export const MenuItem = () => {
  const isLargeScreen = useIsLargeScreen();

  return (
    <div className={`${isLargeScreen ? "w-[300px]" : "w-full"} flex-1 flex`}>
      <ActiveMenuItem />
    </div>
  );
};
