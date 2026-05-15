"use client"

import Image from "next/image";
import { ButtonHTMLAttributes, useEffect, useRef, useState } from "react";
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import { useSearchParams } from "next/navigation";
import { compileCode } from "@/lib/interpreter/assembler";
import { Maximize } from "lucide-react";
import NavBar from "@/components/NavBar";
export default function Home() {
  const workerRef = useRef<Worker | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const screenRef = useRef<HTMLCanvasElement | null>(null);
  const [userCode, setUserCode] = useState<string>("");
  const KEY_MAP = {
    "1": 0x1, "2": 0x2, "3": 0x3, "4": 0xC,
    "q": 0x4, "w": 0x5, "e": 0x6, "r": 0xD,
    "a": 0x7, "s": 0x8, "d": 0x9, "f": 0xE,
    "z": 0xA, "x": 0x0, "c": 0xB, "v": 0xF
  };

  function monitor_keys(worker : Worker) {
    addEventListener('keydown', (e) => {
      if (KEY_MAP[e.key.toLowerCase()]){
        worker.postMessage({message: "KEY_DOWN", key: KEY_MAP[e.key.toLowerCase()]})
      }
    })

    addEventListener('keyup', (e) => {
      if (KEY_MAP[e.key.toLowerCase()]){
        worker.postMessage({message: "KEY_UP", key: KEY_MAP[e.key.toLowerCase()]})
      }
    })
  }

  function setup_chip_worker(worker : Worker | null) {
    workerRef.current = worker;
    if (!workerRef.current) return;
    worker.onmessage = ((e : MessageEvent) => {
      switch (e.data.message){
        case "READY":
          worker.postMessage({message : "LOAD_ROM", rom_name : "Pong"})
          worker.postMessage({message : "RUN_CHIP"})

          
          break
        case "RENDER": 
          render_on_screen(e.data.pixels)
          break
      }
    })
  }
  function render_on_screen(screen ) {
    
    const canvas = screenRef.current;
    const ctx = canvas.getContext("2d")
    const WIDTH = 64;
    const HEIGHT = 32;
    
    ctx.fillStyle = "white";
    const PIXEL_SIZE = 4
    for (let pixel = 0; pixel < screen.length; pixel ++) {
      const y = Math.floor(pixel / 64) ;
      const x = pixel % 64  ;
      ctx.strokeStyle = '#ffffffff'

      if (screen[pixel]){
        ctx.beginPath();
        ctx?.fillRect(x * PIXEL_SIZE,y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
        ctx.stroke();

      }else{
        ctx.beginPath();
        ctx?.clearRect(x * PIXEL_SIZE,y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
        ctx.stroke();
      }
    }

    
  }
  
  useEffect(() => {
    const worker = new Worker(new URL('../../public/workers/chip8.worker.ts', import.meta.url));

    setup_chip_worker(worker);
    monitor_keys(worker);
  
    
  }, []);

  
  function handleRunCode() {
    const rom = compileCode(userCode);
    if (!rom || rom.romSize === 0) return;
    
    workerRef.current?.postMessage({
      message: "LOAD_ROM_DIRECTLY", 
      rom_data: rom.romData, 
      rom_size: rom.romSize
    });
  }
  return (

    <div className="flex flex-col min-h-screen w-full bg-zinc-300 font-sans dark:bg-black">

      <div className="flex h-full flex-row">
        <NavBar></NavBar>

      <main className="flex flex-1 w-full h-full flex-col items-center bg-white dark:bg-black sm:items-start">
        <div className="grid grid-cols-2 h-[100vh] w-full">
          <div className="bg-zinc-900 flex flex-col min-h-0 i overflow-hidden">
            <div className="flex justify-between items-center pr-10">
            <p className="py-2 font-semibold pl-3">main.ch8</p>
            <button ref={buttonRef} className="flex items-center bg-green-600 p-[3px] h-6 rounded-[4px]" onClick={handleRunCode}>BUILD AND RUN</button>
            </div>
            <Editor height="100%" className="h-full" width="100%hh" theme="vs-dark" defaultLanguage="rust" defaultValue="// some comment" onChange={(e) => {setUserCode(e || ""); console.log(userCode)}} />
          </div>
          <div className="flex flex-col w-full h-full">
            <div className="w-full h-10 border-l  flex items-center px-4 border-b border-white/15 bg-zinc-900" id="bar">
              <p>Preview</p>
            </div>
            <div className="flex flex-row w-full flex-1">
              <div className="flex flex-col">
                <div className="w-[30vw] bg-zinc-900 border-x border-white/15">
                  <div className="flex flex-row h-8 items-center px-2">
                    <Maximize className="w-4 h-4 mr-2" />
                    <p className="text-sm">Fullscreen</p>
                  </div>
                </div>
                <canvas ref={screenRef} className="w-[30vw] h-[15vw] border border-white"></canvas>
              </div>
              <div className="flex-1 bg-zinc-900 p-2 border-l h-[17vw] border-white/15">
                <p>Opcodes:</p>
              </div>
            </div>
          </div>
          
        </div>
      </main>
      </div>
      
    </div>
  );
}
