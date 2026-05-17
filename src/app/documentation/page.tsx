"use client"

import NavBar from "@/components/NavBar";
import { instructions } from "@/lib/interpreter/instructions";

export default function page() {
  return (
    <main className="flex flex-col w-full h-full p-4">
      <div className="mt-4">
        {Object.entries(instructions).map(([key, def]) => {
          return (
          <div key={key}>
          <h2 className="font-bold text-[1.5rem]">
            {key}
          </h2>
          {def.map((definition, key) => <p className="font" key={key}>{definition.helper} Args: ({definition.argsLayout.join(", ")})</p>)}
          </div>
          )
        })}
      </div>
    </main>
  );
}