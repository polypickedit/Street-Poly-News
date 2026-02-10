import { createContext } from "react";
import { ActiveAdmin } from "@/types/admin";

export interface AdminContextType {
  isAdmin: boolean;
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  toggleAdminMode: () => void;
  isWalkthroughActive: boolean;
  setIsWalkthroughActive: (active: boolean) => void;
  hasCompletedWalkthrough: boolean;
  completeWalkthrough: () => void;
  walkthroughStep: number;
  setWalkthroughStep: (step: number) => void;
  activeAdmins: ActiveAdmin[];
  hasDismissedWalkthrough: boolean;
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);
