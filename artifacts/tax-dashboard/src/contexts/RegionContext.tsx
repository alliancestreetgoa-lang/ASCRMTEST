import { createContext, useContext, useState } from "react";

export type Region = "All" | "UK" | "UAE";

interface RegionContextValue {
  region: Region;
  setRegion: (region: Region) => void;
  countryParam: string | undefined;
}

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [region, setRegion] = useState<Region>("All");

  const countryParam = region === "All" ? undefined : region;

  return (
    <RegionContext.Provider value={{ region, setRegion, countryParam }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within RegionProvider");
  return ctx;
}
