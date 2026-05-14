"use client"
import { useEffect, useState } from "react";
import { ArrowLeft, Braces, LucideIcon } from "lucide-react"
export default function NavBar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (

    <nav className={`${isCollapsed? "w-16" : "w-50"} bg-zinc-900  p-0 ease-in-out duration-250 min-h-screen text-white flex flex-col p-4 border-r border-gray-700`}>
      <div className="flex justify-between mb-4">
        
        <p className={`${isCollapsed ? "w-0 opacity-0" : "w-12 opacity-100"}  transition-all whitespace-nowrap overflow-hidden ease-in duration-150 `}>Menu</p>
        <button className="flex align-self-end" onClick={() => setIsCollapsed(prev => !prev)}>
          <ArrowLeft
          className={`${isCollapsed? "rotate-180" : ""} ease-in-out duration-150 `}
          />
        </button>




      </div>
      <Line></Line>
      <Option
        icon={<Braces/>}
        isCollapsed={isCollapsed}
      >
        Editor
      </Option>

    </nav>

  )
}
function Line() {
  return <div className="bg-white/15 w-full h-[1px] rounded-lg mb-6"></div>
}
function Option({isCollapsed , icon, children} : {boolean}) {
  return (
    <div className="flex flex-row ">
      {icon}
      <p className={`${isCollapsed ? "w-0 opacity-0" : "w-12 opacity-100 ml-3"} transition-all whitespace-nowrap overflow-hidden ease-in duration-150 `}>
        {children}
       </p>

    </div>
  )
}