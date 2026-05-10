"use client"

import Image from "next/image";
import { useEffect, useRef } from "react";
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
export default function Home() {
  const workerRef = useRef<Worker | null>(null);
  const screenRef = useRef<HTMLCanvasElement | null>(null);
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
  return (
    <div className="flex flex-col flex-1 items-center  justify-center bg-zinc-300 font-sans dark:bg-black">
      <main className="flex flex-1 w-full  flex-col items-center justify-between py-32 bg-white dark:bg-black sm:items-start">
        <div className="grid grid-cols-2">
          <Editor height="80vh" width="48vw" theme="vs-dark" defaultLanguage="rust" defaultValue="// some comment" />
          <canvas ref={screenRef} className="w-[48vw] h-[25vw] border border-white "></canvas>

        </div>
      </main>
    </div>
  );
}
