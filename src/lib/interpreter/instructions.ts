import { InstructionDef } from "./types/interpreter";

export const instructions: Record<string, InstructionDef[]> = {
  "SYS": [{
    template: 0x0000,
    argsLayout: ["NNN"],
    requiredTypes: ["NUMBER"],
    helper: "Jump to a machine code routine at nnn."
  }],
  "CLS": [{
    template: 0x00E0,
    argsLayout: [],
    requiredTypes: [],
    helper: "Clear the display."
  }],
  "RET": [{
    template: 0x00EE,
    argsLayout: [],
    requiredTypes: [],
    helper: "Return from a subroutine."
  }],
  "JP": [
    {
      template: 0x1000,
      argsLayout: ["NNN"],
      requiredTypes: ["NUMBER"],
      helper: "Jump to location nnn."
    },
    {
      template: 0xB000,
      argsLayout: ["X", "NNN"],
      requiredTypes: ["REGISTER", "NUMBER"],
      helper: "Jump to location nnn + V0."
    }
  ],
  "CALL": [{
    template: 0x2000,
    argsLayout: ["NNN"],
    requiredTypes: ["NUMBER"],
    helper: "Call subroutine at nnn."
  }],
  "SE": [
    {
      template: 0x3000,
      argsLayout: ["X", "NN"],
      requiredTypes: ["REGISTER", "NUMBER"],
      helper: "Skip next instruction if Vx = kk."
    },
    {
      template: 0x5000,
      argsLayout: ["X", "Y"],
      requiredTypes: ["REGISTER", "REGISTER"],
      helper: "Skip next instruction if Vx = Vy."
    }
  ],
  "SNE": [
    {
      template: 0x4000,
      argsLayout: ["X", "NN"],
      requiredTypes: ["REGISTER", "NUMBER"],
      helper: "Skip next instruction if Vx != kk."
    },
    {
      template: 0x9000,
      argsLayout: ["X", "Y"],
      requiredTypes: ["REGISTER", "REGISTER"],
      helper: "Skip next instruction if Vx != Vy."
    }
  ],
  "LD": [
    {
      template: 0x6000,
      argsLayout: ["X", "NN"],
      requiredTypes: ["REGISTER", "NUMBER"],
      helper: "Set Vx = kk."
    },
    {
      template: 0x8000,
      argsLayout: ["X", "Y"],
      requiredTypes: ["REGISTER", "REGISTER"],
      helper: "Set Vx = Vy."
    },
    {
      template: 0xA000,
      argsLayout: ["I", "NNN"],
      requiredTypes: ["INDEX_REGISTER", "NUMBER"],
      helper: "Set I = nnn."
    },
    {
      template: 0xF007,
      argsLayout: ["X", "DT"],
      requiredTypes: ["REGISTER", "DELAY_TIMER"],
      helper: "Set Vx = delay timer value."
    },
    {
      template: 0xF00A,
      argsLayout: ["X", "K"],
      requiredTypes: ["REGISTER", "KEY"],
      helper: "Wait for a key press, store the value of the key in Vx."
    },
    {
      template: 0xF015,
      argsLayout: ["DT", "X"],
      requiredTypes: ["DELAY_TIMER", "REGISTER"],
      helper: "Set delay timer = Vx."
    },
    {
      template: 0xF018,
      argsLayout: ["ST", "X"],
      requiredTypes: ["SOUND_TIMER", "REGISTER"],
      helper: "Set sound timer = Vx."
    },
    {
      template: 0xF029,
      argsLayout: ["F", "X"],
      requiredTypes: ["FONT_SPECIFIER", "REGISTER"],
      helper: "Set I = location of sprite for digit Vx."
    },
    {
      template: 0xF033,
      argsLayout: ["B", "X"],
      requiredTypes: ["BCD_SPECIFIER", "REGISTER"],
      helper: "Store BCD representation of Vx in memory locations I, I+1, and I+2."
    },
    {
      template: 0xF055,
      argsLayout: ["I_VAL", "X"],
      requiredTypes: ["INDEX_REGISTER_VALUE", "REGISTER"],
      helper: "Store registers V0 through Vx in memory starting at location I."
    },
    {
      template: 0xF065,
      argsLayout: ["X", "I_VAL"],
      requiredTypes: ["REGISTER", "INDEX_REGISTER_VALUE"],
      helper: "Read registers V0 through Vx from memory starting at location I."
    }
  ],
  "ADD": [
    {
      template: 0x7000,
      argsLayout: ["X", "NN"],
      requiredTypes: ["REGISTER", "NUMBER"],
      helper: "Set Vx = Vx + kk."
    },
    {
      template: 0x8004,
      argsLayout: ["X", "Y"],
      requiredTypes: ["REGISTER", "REGISTER"],
      helper: "Set Vx = Vx + Vy, set VF = carry."
    },
    {
      template: 0xF01E,
      argsLayout: ["I", "X"],
      requiredTypes: ["INDEX_REGISTER", "REGISTER"],
      helper: "Set I = I + Vx."
    }
  ],
  "OR": [{
    template: 0x8001,
    argsLayout: ["X", "Y"],
    requiredTypes: ["REGISTER", "REGISTER"],
    helper: "Set Vx = Vx OR Vy."
  }],
  "AND": [{
    template: 0x8002,
    argsLayout: ["X", "Y"],
    requiredTypes: ["REGISTER", "REGISTER"],
    helper: "Set Vx = Vx AND Vy."
  }],
  "XOR": [{
    template: 0x8003,
    argsLayout: ["X", "Y"],
    requiredTypes: ["REGISTER", "REGISTER"],
    helper: "Set Vx = Vx XOR Vy."
  }],
  "SUB": [{
    template: 0x8005,
    argsLayout: ["X", "Y"],
    requiredTypes: ["REGISTER", "REGISTER"],
    helper: "Set Vx = Vx - Vy, set VF = NOT borrow."
  }],
  "SHR": [{
    template: 0x8006,
    argsLayout: ["X", "Y"],
    requiredTypes: ["REGISTER", "REGISTER"],
    helper: "Set Vx = Vx SHR 1."
  }],
  "SUBN": [{
    template: 0x8007,
    argsLayout: ["X", "Y"],
    requiredTypes: ["REGISTER", "REGISTER"],
    helper: "Set Vx = Vy - Vx, set VF = NOT borrow."
  }],
  "SHL": [{
    template: 0x800E,
    argsLayout: ["X", "Y"],
    requiredTypes: ["REGISTER", "REGISTER"],
    helper: "Set Vx = Vx SHL 1."
  }],
  "RND": [{
    template: 0xC000,
    argsLayout: ["X", "NN"],
    requiredTypes: ["REGISTER", "NUMBER"],
    helper: "Set Vx = random byte AND kk."
  }],
  "DRW": [{
    template: 0xD000,
    argsLayout: ["X", "Y", "N"],
    requiredTypes: ["REGISTER", "REGISTER", "NUMBER"],
    helper: "Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision."
  }],
  "SKP": [{
    template: 0xE09E,
    argsLayout: ["X"],
    requiredTypes: ["REGISTER"],
    helper: "Skip next instruction if key with the value of Vx is pressed."
  }],
  "SKNP": [{
    template: 0xE0A1,
    argsLayout: ["X"],
    requiredTypes: ["REGISTER"],
    helper: "Skip next instruction if key with the value of Vx is not pressed."
  }]
};