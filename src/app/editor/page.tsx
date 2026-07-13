"use client"

import Image from "next/image";
import { ButtonHTMLAttributes, useEffect, useRef, useState, FC } from "react";
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import { useSearchParams } from "next/navigation";
import { compileCode } from "@/lib/interpreter/assembler";
import { ArrowDown, ArrowUp, Maximize, TriangleRight } from "lucide-react";
import NavBar from "@/components/NavBar";
import { env } from "process";
import { createNewProject, getProject, saveProject, getAllProjectIds, saveSprite } from "@/lib/projects_manager/manageEnv";
  interface ISystemState  {
    "pc" : number,
    "registers" : number[],
    "delay_timer" : number,
    "sound_timer" : number,
    "I" : number
  }
export default function Home() {
  const workerRef = useRef<Worker | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const screenRef = useRef<HTMLCanvasElement | null>(null);
  const opcodesTextRef = useRef<HTMLParagraphElement | null>(null);
  const [lastOpcodes, setLastOpcodes] = useState<Array<string>>([])


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
  const [systemState, setSystemState] = useState<ISystemState>({registers: [0], pc: 0, delay_timer: 0, sound_timer: 0, I: 0})


  const DEFAULT_CODE = `

LD V1, 5; W
LD V2, 8; S
LD V3, 7; A
LD V4, 9; D
LD V0, 0; User "character"
RND V5, 0xFF; random X (max 255)
RND V6, 0xFF; random Y (max 255)

JP load_sprite;

main:
    CLS;
    DRW V5, V6, 8;
    LD V15, K;
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

load_sprite:
    LD I, sprite;
    JP main;


sprite:
    DB 0x70, 0x70, 0x20, 0x70, 0xA8, 0x20, 0x50, 0x50;

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

  function handle_data_update(regs : number[], opcode : number, pc : number, dt: number, st: number, I: number) {
    setLastOpcodes(prevOpcodes => {
      if (prevOpcodes.length >= 11) {
        return [...prevOpcodes.slice(1), "0x" + opcode.toString(16).toUpperCase()];
      } else {
        return [...prevOpcodes, "0x" +opcode.toString(16).toUpperCase()];
      } 
    });
    setSystemState({registers: regs, pc: pc, delay_timer: dt, sound_timer: st, I: I})
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
          handle_data_update(e.data.registers, e.data.opcode, e.data.pc, e.data.dt, e.data.st, e.data.I)
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
    ctx.beginPath();
    const PIXEL_SIZE = 4
    for (let pixel = 0; pixel < screen.length; pixel ++) {
      const y = Math.floor(pixel / 64) ;
      const x = pixel % 64  ;

      if (screen[pixel]){
        
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
    const project_id = createNewProject("Project 1", "123");
    saveSprite(project_id , {
      id: "123",
      name: "test",
      description: "test",
      data: "0x70, 0x70, 0x20, 0x70, 0xA8, 0x20, 0x50, 0x50"
    })
  
    
  }, []);

  
  function handleRunCode() {
    const rom = compileCode(userCode);
    console.log("RON: " , rom)
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
          <div className="bg-zinc-900 flex flex-col min-h-0 p-0 i overflow-hidden">
            <div className="flex justify-between items-center pr-10">
            <p className="py-2 font-semibold pl-3">main.ch8</p>
            <button ref={buttonRef} className="flex items-center border h-[20px] border-white/15 border-[1px] p-4 text-zinc-200 hover:bg-white duration-250 ease-in-out font-semibold hover:text-zinc-900  h-10 rounded-[4px]" onClick={handleRunCode}> RUN ►</button>
            </div>
            <Editor height="100%" className="h-full" width="100%" theme="vs-dark" defaultLanguage="rust" defaultValue={DEFAULT_CODE} onChange={(e) => {setUserCode(e || ""); console.log(userCode)}} />
          </div>
          <div className="flex flex-col w-full h-full">
            <div className="w-full h-10 border-l gap-x-4 child:border flex items-center px-4 border-b border-white/15 bg-zinc-900" id="bar">
              {TABS.map((tab_data, idx) => {
                return (

                  <p key={tab_data.id} onClick={() => setTab(tab_data)} className={`${tab.id == tab_data.id ? "bg-white text-zinc-900" : ""} p-2 font-semibold hover:cursor-pointer`}>{tab_data.name}</p>

                )
              })}
            </div>
            <div>
              <tab.component
                lastOpcodes={lastOpcodes}
                systemState={systemState}
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

function PreviewTab({lastOpcodes, screenRef, systemState, } : {lastOpcodes: string[], screenRef: HTMLCanvasElement, systemState: ISystemState}) {
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
                <canvas ref={screenRef} className="w-[30vw] h-[15vw]"></canvas>
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
            <div className="flex flex-2 bg-zinc-900 w-full h-[7.5vw] ">
              <div className="grid grid-rows-2 w-[30vw] grid-cols-8 p-1 gap-[1px]">
               {systemState.registers.map((val, i) => (
                <div key={i} onClick={() => {navigator.clipboard.writeText(systemState.registers[i].toString())}}  className={`active:bg-white/70 rounded-[3px] border border-white/20 hover:text-zinc-900 hover:bg-white duration-125 ease-in-out h-[3.3vw] flex flex-col text-center bg-zinc-900`}>
                  <div className="w-full group items-center text-center bg-black/15 text-[0.8rem] font-bold"> V{i}</div>
                  <p className="mt-[0.3rem] group ">
                  {systemState.registers[i]}
                  </p>
                </div>
               )
              )
              }

              </div>
              <div className="flex-1 text-white bg-zinc-900">
                <div className="grid grid-cols-2 gap-2  text-sm mt-[3px]">

                  <div className="bg-black/20 p-1 rounded border border-white/20">
                    <span className="text-xs text-white block font-bold">PC</span>
                    <p className="font-mono text-base">{systemState.pc}</p>
                  </div>
                  <div className="bg-black/20 p-1 rounded border border-white/20">
                    <span className="text-xs text-white block font-bold">I</span>
                    <p className="font-mono text-base">0x{systemState.I.toString(16).toUpperCase()}</p>
                  </div>
                  <div className="bg-black/20 p-1 rounded border border-white/20">
                    <span className="text-xs text-white block font-bold">DT (Delay)</span>
                    <p className="font-mono text-base">{systemState.delay_timer}</p>
                  </div>
                  <div className="bg-black/20 p-1 rounded border border-white/20">
                    <span className="text-xs text-white block font-bold">ST (Sound)</span>
                    <p className="font-mono text-base">{systemState.sound_timer}</p>
                  </div>

                </div>
              </div>
            </div>
        </section>
  );
}

function SpritesEditor({lastOpcodes, screenRef, systemState, } : {lastOpcodes: string[], screenRef: HTMLCanvasElement, systemState: ISystemState}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [spriteHeight, setSpriteHeight] = useState<number>(15);
  const [spriteData, setSpriteData] = useState<boolean[]>(new Array(15*8).fill(0));
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false)
  const [lastChangedI, setLastChangedI] = useState<number | null>(null)
  const [hexText, setHexText] = useState<string>("")
  const spriteNameRef = useRef<HTMLInputElement | null>(null) 
  const spriteDescRef = useRef<HTMLInputElement | null>(null) 

      const WIDTH = 8;
    const HEIGHT = 15;

  function drawGrid() {
    const canvas = canvasRef.current;
    
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    const pixelWidth = canvas.width / WIDTH;
    const pixelHeight = canvas.height / HEIGHT;
    
    ctx.fillStyle = "white";
    ctx?.beginPath();
    const PIXEL_SIZE = 4
    for (let x = 0; x < WIDTH; x++){
      ctx?.moveTo(x * pixelWidth, 0)
      ctx?.lineTo(x * pixelWidth, pixelHeight * HEIGHT)
      ctx?.stroke();
    }

    for (let y = 0; y < HEIGHT; y++) {
      ctx?.moveTo(0, y * pixelHeight)
      ctx?.lineTo(WIDTH * pixelWidth, y * pixelHeight)
      ctx?.stroke();
    }
  }
  function cutHexData(hexData) {
    if (hexData.length === 0 || hexData.at(-1) > 0) {
      return hexData;
    }
    return cutHexData(hexData.slice(0, -1))
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    const pixelWidth = canvas.width / WIDTH;
    const pixelHeight = canvas.height / HEIGHT;
    let hexData = [] // 8 hexes

    for ( let i = 0; i < HEIGHT; i ++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit ++ ) {
        if (spriteData[i * 8 + bit]) {
          byte |= (1 << bit)
          
        }
        
      }

      hexData.push("0x" + byte.toString(16))

    }
    
    
    hexData = cutHexData(hexData)

    for (let i = 0; i < spriteData.length; i++) {
      ctx.fillStyle = "red";

      if (spriteData[i]) {
        ctx.fillStyle = "white";
        
      }

      const x = i % WIDTH;
      const y = Math.floor(i / WIDTH);

      ctx.fillRect(x * pixelWidth + 1, y * pixelHeight + 1, pixelWidth - 2, pixelHeight - 2);
    }

    setHexText(hexData.join(", "))

    
  }, [spriteData])

  function handleMouseMove(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + 1;
    const y = e.clientY - rect.top + 1;
    const canvas = canvasRef.current;

    
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    const pixelWidth = canvas.width / WIDTH;
    const pixelHeight = canvas.height / HEIGHT;
    console.log(`PIXE: x: ${Math.floor(x/pixelWidth)} ; y: ${Math.floor(y/pixelHeight)}`)
    if (isMouseDown) {
      let calc_x = Math.floor(x/pixelWidth) 
      let calc_y = Math.floor(y/pixelHeight) 
      
      const new_arr = [...spriteData] ;
      const idx = calc_x + calc_y * WIDTH
      if (lastChangedI == idx ) return
      new_arr[idx] = !new_arr[idx];
      setLastChangedI(idx)
      setSpriteData(new_arr)
      console.log("DRAW", calc_x, calc_y)
    }
  }

  function handleMouse(e, isDown : boolean) {
    setIsMouseDown(isDown);
    if (!isDown) return
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return
    const x = e.clientX - rect.left + 1;
    const y = e.clientY - rect.top + 1;
    const canvas = canvasRef.current;


    
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    const pixelWidth = canvas.width / WIDTH;
    const pixelHeight = canvas.height / HEIGHT;
    const calc_x =Math.floor(x/ pixelWidth);
    const calc_y = Math.floor(y / pixelWidth);
    const idx = calc_x + calc_y * WIDTH
    setLastChangedI(idx);

    const new_arr = [...spriteData];
    new_arr[idx] = !new_arr[idx];
    setSpriteData(new_arr);

    
  }
  
  useEffect(() => {
    drawGrid(canvasRef.current)
  }, [])

  function saveSprite() {
    const spriteName = spriteNameRef.current?.value;
    const spriteDesc = spriteDescRef.current?.value;
    localStorage.setItem("project_env", project_env)
  }

  return (
    <div>
      <div className="flex text-center flex-row bg-zinc-900 p-3">

        <canvas ref={canvasRef} onMouseLeave={(e) => handleMouse(e, false)} onMouseUp={(e) => {handleMouse(e, false)}} onMouseDown={(e) => {handleMouse(e, true)}} onMouseMove={handleMouseMove} width={8 * 20} height={spriteHeight * 20} className="bg-red-400">

        </canvas>
          <div className="">
          <div onClick={() => {navigator.clipboard.writeText(hexText)}} className=" bg-zinc-950 flex group hover:cursor-pointer h-1/3 w-2/3  flex-col">
            <p className="group ">HEX (click to copy):</p>
            <p className="group w-full">{hexText}</p>
          </div>
          <div className="flex flex-col w-2/3 items- p-2 gap-2">
            <label className="flex flex-col items-start font-semibold">
              <p>
                Sprite name:
              </p>
              <input ref={spriteNameRef} className="p-2 border border-white/40 border-1 text-white/80 font-semibold w-40 h-8 bg-zinc-950 italic font-normal text-[0.8rem]" placeholder="Sprite name"></input>
            </label>
            <label className="flex flex-col items-start font-semibold">

              <p>
                Sprite desc:
              </p>
              <input ref={spriteDescRef} className="p-2 border border-white/40 border-1 text-white/80 font-semibold w-40 h-8 bg-zinc-950 italic font-normal text-[0.8rem]" placeholder="Sprite description"></input>

            </label>
            <label>
              <button onClick={saveSprite}>Save sprite</button>
            </label>
          </div>
          </div>
      </div>
              <button>
          <p className="text-[1.4rem]">Create new sprite</p>
        </button >              <button onClick={() => setSpriteData((new Array(8*15)).fill(0))}>
          <p className="text-[1.4rem]">Clear</p>
        </button>
      <div>
        <p>Sprites list:</p>
        <div>
          <div>
            <p>Sprite Name</p>
            <button>Load sprite into editor</button>
          </div>
        </div>
      </div>

    </div>
  )
}
