import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { View, type ScrollView } from "react-native";

const SCROLL_OFFSET = 12;

type HouseDetailScrollContextValue = {
  contentRef: RefObject<View | null>;
  scrollToSection: (sectionRef: RefObject<View | null>) => void;
};

const HouseDetailScrollContext = createContext<HouseDetailScrollContextValue | null>(null);

type ProviderProps = {
  scrollRef: RefObject<ScrollView | null>;
  children: ReactNode;
};

export function HouseDetailScrollProvider({ scrollRef, children }: ProviderProps) {
  const contentRef = useRef<View | null>(null);

  const scrollToSection = useCallback(
    (sectionRef: RefObject<View | null>) => {
      const content = contentRef.current;
      const section = sectionRef.current;
      const scroll = scrollRef.current;
      if (!content || !section || !scroll) return;

      section.measureLayout(content, (_x, y) => {
        scroll.scrollTo({ y: Math.max(0, y - SCROLL_OFFSET), animated: true });
      });
    },
    [scrollRef],
  );

  return (
    <HouseDetailScrollContext.Provider value={{ contentRef, scrollToSection }}>
      {children}
    </HouseDetailScrollContext.Provider>
  );
}

export function useHouseDetailScroll() {
  const ctx = useContext(HouseDetailScrollContext);
  if (!ctx) {
    throw new Error("useHouseDetailScroll must be used within HouseDetailScrollProvider");
  }
  return ctx;
}
