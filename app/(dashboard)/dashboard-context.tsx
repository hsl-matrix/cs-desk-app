"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type TabInteractionMode = "sms" | "chat" | "stt";

export interface DashboardTab {
  id: string;
  title: string;
  mode: TabInteractionMode;
}

interface DashboardContextValue {
  tabs: DashboardTab[];
  activeTabId: string;
  addTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setTabMode: (id: string, mode: TabInteractionMode) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const initialTabs: DashboardTab[] = [
  { id: "call-1", title: "상담 1", mode: "sms" },
  { id: "call-2", title: "상담 2", mode: "chat" },
];

export function DashboardProvider({ children }: { children: ReactNode }) {
  const counterRef = useRef(initialTabs.length);
  const [tabs, setTabs] = useState<DashboardTab[]>(() => initialTabs);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? "call-1");

  const addTab = useCallback(() => {
    counterRef.current += 1;
    const id = `call-${counterRef.current}`;
    const title = `상담 ${counterRef.current}`;
    const newTab: DashboardTab = { id, title, mode: "sms" };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      const index = prev.findIndex((tab) => tab.id === id);
      if (index === -1) {
        return prev;
      }

      const nextTabs = prev.filter((tab) => tab.id !== id);
      if (activeTabId === id) {
        const fallback = nextTabs[index - 1] ?? nextTabs[index] ?? nextTabs[0];
        if (fallback) {
          setActiveTabId(fallback.id);
        }
      }

      return nextTabs;
    });
  }, [activeTabId]);

  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const setTabMode = useCallback((id: string, mode: TabInteractionMode) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === id ? { ...tab, mode } : tab)),
    );
  }, []);

  const value = useMemo<DashboardContextValue>(
    () => ({ tabs, activeTabId, addTab, closeTab, setActiveTab, setTabMode }),
    [tabs, activeTabId, addTab, closeTab, setActiveTab, setTabMode],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}
