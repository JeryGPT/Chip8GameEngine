# Chip8GameEngine

A web-based **CHIP-8 emulator**, **assembler**, and **game development environment** built with Next.js and WebAssembly.

Write CHIP-8 games in a clean assembly language, compile instantly, and run them directly in the browser with real-time debugging.

---

## ✨ Features

- **Custom CHIP-8 Assembler** with readable mnemonics, labels, and macros
- **Live Monaco Editor** with syntax highlighting and IntelliSense
- **High-performance Emulator** (C core compiled to WebAssembly)
- **Real-time Debug Panel** (registers, PC, I register, stack, timers, etc.)
- **Standard CHIP-8 Keyboard Mapping**
- **Built with Next.js 16 + TypeScript + Tailwind CSS**
- **Full CHIP-8 CPU Emulation** with accurate opcode decoding

---

## 📖 CHIP-8 Overview

CHIP-8 is a small interpreted virtual machine created in the 1970s by Joseph Weisbecker. It is widely used as an entry point into emulator development due to its compact 35-opcode instruction set and simple architecture.

**Specifications:**
- 4 KB of memory
- 16 general-purpose 8-bit registers (`V0` to `VF`)
- 64×32 monochrome display
- 16-key hexadecimal keypad
- Two 60 Hz timers (delay and sound)


### Keyboard Mapping
 
The standard CHIP-8 keypad maps as follows:
  ```
CHIP-8 Keypad    Computer Keyboard
1 2 3 C          1 2 3 4
4 5 6 D     →    Q W E R
7 8 9 E          A S D F
A 0 B F          Z X C V
```

---

## 🚀 Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/JeryGPT/Chip8GameEngine.git
   cd Chip8GameEngine

2. Install dependencies:
   ```bash
   npm install

3. Run the development server:
   ```bash
   npm run dev

4. Open https://localhost:3000 in your browser.


---
## Project structure
```text
Chip8GameEngine/
│
├── public/
│ ├── chip8emulator/ # WebAssembly emulator core
│ │ ├── chip8_wasm.c # Original C source (reference)
│ │ ├── wasm_output.js # Emscripten glue code
│ │ └── wasm_output.wasm # Compiled WebAssembly binary
│ │
│ ├── roms/ # Preloaded Chip-8 games
│ │ ├── Pong.ch8
│ │ ├── RPS.ch8
│ │ ├── invaders.ch8
│ │ └── octojam.ch8
│ │
│ └── workers/ # Web Workers for background execution
│ ├── chip8.worker.ts # Main Chip-8 worker
│ └── roms/ # Additional ROM assets (optional)
│
├── src/
│ ├── app/
│ │ ├── editor/ # Main editor + emulator interface
│ │ ├── documentation/ # CHIP-8 reference & guides
│ │ └── layout.tsx
│ │
│ ├── components/ # Reusable UI components
│ │
│ └── lib/interpreter/
│ ├── instructions.ts
│ ├── assembler.ts
│ ├── tokenizer.ts
│ └── parser.ts
```
---
## 🛠️ Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Editor: Monaco Editor
- Emulator Core: C compiled to WebAssembly
- Build Tool: Turbopack / Next.js
---
## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests for bug fixes, new features, documentation improvements, or support for extensions (Super CHIP-8, XO-CHIP, etc.).

---

Made with ❤️ for the retro computing and emulator community.

Happy coding and enjoy building your own CHIP-8 games!
