// Definicja typów dla Twoich funkcji z C
interface Chip8Module extends EmscriptenModule {
    _get_chip_ptr(): number;
    _chip8_tick(): void;
}
    console.log("Test")

// Emscripten wrzuca 'Module' do globalnego zakresu w Workerze
declare var Module: Chip8Module;

(self as any).Module = {
    locateFile: (path: string) => path.endsWith('.wasm') ? '/wasm_output.wasm' : path,
    onRuntimeInitialized: () => {
        console.log("WASM Ready!");

        postMessage({message: "READY"});



    }
};

importScripts('/wasm_output.js');

console.log("Dostępne funkcje:", {
    load: !!Module._load_rom_wasm,
    tick: !!Module._chip8_tick,
    malloc: !!Module._malloc,
});

let chipAddr: number = 0;
self.onmessage = (e ) => {
    switch (e.data.message) {
        case "RUN_CHIP":
            console.log("RUN")
            run_chip();
            break
        case "LOAD_ROM":
            load_rom(e.data.rom_name);
            break;
        case "KEY_DOWN":
            Module._set_key(e.data.key, 1)
            break;
        case "KEY_UP":
            Module._set_key(e.data.key, 0)
            break;
        default: 
            console.log("AFG: ", e.data.message)
    }
}


async function load_rom(rom_name : string) {
    rom_name = rom_name + ".ch8";
    const rom = await fetch(`/roms/${rom_name}` );
    const buffer = (await rom.arrayBuffer())
    const rom_size = await buffer.byteLength;
    const rom_data = new Uint8Array(buffer);
    const chipPtr = Module._get_chip_ptr();
    console.log(rom_data)
    console.log("before init", Module.HEAPU8.slice(chipPtr + 512,chipPtr + 4096-512));

    Module._chip8_init(chipPtr);
    console.log("after init", Module.HEAPU8.slice(chipPtr + 512, chipPtr + 4096-512));

     const ptr = Module._malloc(rom_size); // stworzenie przestrzeni na rom
    Module.HEAPU8.set(rom_data, ptr); // uzycie pamieci
    Module._load_rom_wasm(rom_size, ptr);
    Module._free(ptr);
    console.log("aftr rom ", Module.HEAPU8.slice(chipPtr + 512,chipPtr +  4096-512));

    

    


    
        

}

function run_chip() {
        chipAddr = Module._get_chip_ptr();
        
        
        setInterval(() => {
            Module._chip8_tick();
            const chipPtr = Module._get_chip_ptr();
            const renderFlag = Module.HEAPU8[chipPtr + 6218];
            


            if (renderFlag === 1) {
                const gfxData = new Uint8Array(Module.HEAPU8.buffer, chipAddr + 4118, 2048);
                const frame = new Uint8Array(gfxData);

                
                self.postMessage({ message: 'RENDER', pixels: frame }, [frame.buffer]);
            }
        }, 1000 / 60);
}
