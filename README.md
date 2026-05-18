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
├── src/
│   ├── app/
│   │   ├── editor/          # Main editor + emulator interface
│   │   ├── documentation/   # CHIP-8 reference and guides
│   │   └── layout.tsx
│   ├── components/          # Reusable UI components
│   └── lib/
│       ├── interpreter/     # Core CHIP-8 logic (TS + WASM)
│       │   ├── instructions.ts
│       │   ├── assembler.ts
│       │   ├── disassembler.ts
│       │   └── cpu.ts
│       └── wasm/            # WebAssembly module
├── public/                  # Static assets
├── types/                   # TypeScript definitions
└── package.json
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
