"use client"

import Image from "next/image";
import { ButtonHTMLAttributes, useEffect, useRef, useState, FC } from "react";
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import { useSearchParams } from "next/navigation";
import { compileCode } from "@/lib/interpreter/assembler";
import { Maximize } from "lucide-react";
import NavBar from "@/components/NavBar";
export default function Home() {
  const workerRef = useRef<Worker | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const screenRef = useRef<HTMLCanvasElement | null>(null);
  const opcodesTextRef = useRef<HTMLParagraphElement | null>(null);
  const [lastOpcodes, setLastOpcodes] = useState<Array<string>>([])
  const [registers, setRegisters] = useState<Array<number>>([]);

  interface Itab {
    id: string,
    name: string,
    component: FC<any>
  }

  const TABS : Itab[] =  [
    {
      id : "preview",
      name: "Preview",
      component: PreviewTab
    },
    {
      id: "sprites",
      name: "Sprites editor",
      component: SpritesEditor
    }
  ] 
  const [tab, setTab] = useState<Itab>(TABS[0]);

  const DEFAULT_CODE = `
LD V1, 5; W
LD V2, 8; S
LD V3, 7; A
LD V4, 9; D
LD V0, 0; User "character"
LD V5, 28; X 
LD V6, 0; Y

main:
    CLS;
    LD F, V0; 
    DRW V5, V6, 5;
    JP handle_movement;

handle_movement:
    SKNP V3;
    ADD V5, 255;
    SKNP V4;
    ADD V5, 1;
    SKNP V1;
    ADD V6, 255;
    SKNP V2;
    ADD V6, 1;
    JP main;
`
  const [userCode, setUserCode] = useState<string>(DEFAULT_CODE);

  const KEY_MAP: Record<string, number> = {
    "1": 0x1, "2": 0x2, "3": 0x3, "4": 0xC,
    "q": 0x4, "w": 0x5, "e": 0x6, "r": 0xD,
    "a": 0x7, "s": 0x8, "d": 0x9, "f": 0xE,
    "z": 0xA, "x": 0x0, "c": 0xB, "v": 0xF
  };

  function monitor_keys(worker : Worker) {
    addEventListener('keydown', (e: KeyboardEvent) => {
      if (KEY_MAP[e.key.toLowerCase()] !== undefined){
        worker.postMessage({message: "KEY_DOWN", key: KEY_MAP[e.key.toLowerCase()]})
      }
    })

    addEventListener('keyup', (e: KeyboardEvent) => {
      if (KEY_MAP[e.key.toLowerCase()] !== undefined){
        worker.postMessage({message: "KEY_UP", key: KEY_MAP[e.key.toLowerCase()]})
      }
    })
  }

  function handle_data_update(regs : number[], opcode : number, pc : number) {
    setLastOpcodes(prevOpcodes => {
      if (prevOpcodes.length >= 11) {
        return [...prevOpcodes.slice(1), "0x" + opcode.toString(16).toUpperCase()];
      } else {
        return [...prevOpcodes, "0x" +opcode.toString(16).toUpperCase()];
      } 
    });
    setRegisters(regs);
    return 0;
  }



  function setup_chip_worker(worker : Worker | null) {
    if (worker == null) return;
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
        case "OPCODE":
          handle_data_update(e.data.registers, e.data.opcode, e.data.pc)
      }
    })
  }
  function render_on_screen(screen : number[] ) {
    
    const canvas = screenRef.current;
    if (canvas == null) return;
    const ctx = canvas.getContext("2d")
    if (ctx == null) return;
    const WIDTH = 64;
    const HEIGHT = 32;
    const pixelWidth = canvas.width / WIDTH;
    const pixelHeight = canvas.height / HEIGHT;
    
    ctx.fillStyle = "white";
    const PIXEL_SIZE = 4
    for (let pixel = 0; pixel < screen.length; pixel ++) {
      const y = Math.floor(pixel / 64) ;
      const x = pixel % 64  ;

      if (screen[pixel]){
        ctx.beginPath();
        ctx?.fillRect(x * pixelWidth,y * pixelHeight, pixelWidth, pixelHeight)
        ctx.stroke();

      }else{
        ctx.beginPath();
        ctx?.clearRect(x * pixelWidth,y * pixelHeight, pixelWidth, pixelHeight)
        ctx.stroke();
      }
    }

    
  }
  
  useEffect(() => {
    const worker = new Worker(new URL('../../../public/workers/chip8.worker.ts', import.meta.url));

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

      <main className="flex flex-1 w-full h-full flex-col items-center bg-white dark:bg-black sm:items-start">
        <div className="grid grid-cols-2 h-[100vh] w-full">
          <div className="bg-zinc-900 flex flex-col min-h-0 i overflow-hidden">
            <div className="flex justify-between items-center pr-10">
            <p className="py-2 font-semibold pl-3">main.ch8</p>
            <button ref={buttonRef} className="flex items-center bg-green-600 p-[3px] h-6 rounded-[4px]" onClick={handleRunCode}>BUILD AND RUN</button>
            </div>
            <Editor height="100%" className="h-full" width="100%" theme="vs-dark" defaultLanguage="rust" defaultValue={DEFAULT_CODE} onChange={(e) => {setUserCode(e || ""); console.log(userCode)}} />
          </div>
          <div className="flex flex-col w-full h-full">
            <div className="w-full h-10 border-l gap-x-4 child:border flex items-center px-4 border-b border-white/15 bg-zinc-900" id="bar">
              {TABS.map((tab_data, idx) => {
                return (

                  <p key={tab_data.id} onClick={() => setTab(tab_data)} className={`${tab.id == tab_data.id ? "bg-white/9" : ""} p-2 hover:cursor-pointer`}>{tab_data.name}</p>

                )
              })}
            </div>
            <div>
              <tab.component
                lastOpcodes={lastOpcodes}
                registers={registers}
                screenRef={screenRef}
              />
            
            </div>
            
          </div>
          
        </div>
      </main>
      </div>
      
    </div>
  );
}

function PreviewTab({lastOpcodes, screenRef, registers, } : {lastOpcodes: string[], screenRef: HTMLCanvasElement, registers: number[]}) {
  return (
    <section>
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
                  <div className="grid grid-rows-12 h-full">
                  {
                    lastOpcodes.map((opcode, i) => <p key={i}>{opcode}</p>)
                  }
                  </div>
                </div>

              
              
              
            </div>
            <div className="flex flex-2 bg-zinc-900 w-[30v] h-[7.5vw] ">
              <div className="grid grid-rows-2 grid-cols-8">
               {registers.map((val, i) => (
                <div key={i} className={`w-[3.75vw] h-[3.75vw] border border-white flex flex-col text-center bg-zinc-900`}>
                  <div className="w-full items-center text-center bg-black/15 text-[0.7rem]"> V{i}</div>
                  <p className="mt-[0.3rem]">
                  {registers[i]}
                  </p>
                </div>
               )
              )
              }

              </div>
              <div>
                <p>System State:</p>
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">

                <p>PC: </p>
                <p>I:</p>
                <p>DT: </p>
                <p>ST: </p>
                </div>

              </div>
            </div>
        </section>
  );
}

function SpritesEditor({lastOpcodes, screenRef, registers, } : {lastOpcodes: string[], screenRef: HTMLCanvasElement, registers: number[]}) {
  return (
    <div>

    </div>
  )
}
