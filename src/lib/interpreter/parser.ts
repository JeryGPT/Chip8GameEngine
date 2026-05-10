
import { InstructionDef } from "./types/interpreter"

// x, y, nnn, kk

export function compileInstruction(instruction : InstructionDef, args: number[]) {
  
  let opcode : number = instruction.template;
  
  instruction.argsLayout.forEach((layout, index) => {
    switch (layout) {
      case ("X"):
        opcode |= (args[index] & 0xF) << 8; // X is only 4bits, so i put mask on it in case of overflow
        // also X is the first argument so I move it max to the left
        break;
      case ("Y"):
        opcode |= (args[index] & 0xF) << 4;
        break;
      case ("NN"): // no need to move now cuz those are the last values
        opcode |= (args[index] & 0xFF);
        break;
      case ("NNN"):
        opcode |= (args[index] & 0xFFF);
        break;
      case ("N"):
        opcode |= (args[index] & 0xF);
        break;
    }

  })
  return new Uint8Array([(opcode >> 8) & 0xFF, opcode & 0xFF]);

}
