"use client"

import { createContext, useContext, useState, ReactNode } from "react";

interface ProjectContextType {
  spriteData: boolean[];
  setSpriteData: React.Dispatch<
    React.SetStateAction<boolean[]>
  >;
    logs: string[];
    setLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({children}: {children: ReactNode}) {
    const [spriteData, setSpriteData] = useState<boolean[]>(new Array(15*8).fill(false));
    const [logs, setLogs] = useState<string[]>([]);
    return (
        <ProjectContext.Provider value={{spriteData, setSpriteData, logs, setLogs}}>
            {children}
        </ProjectContext.Provider>
    )
    
}

export function useProjectContext() : ProjectContextType  {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error("useProjectContext must be used within a ProjectProvider");
    }
    return context;
}