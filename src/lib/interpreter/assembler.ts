import { tokenizeCode } from "./tokenizer" 
import { InstructionTokenized } from "./types/tokenizer";
import { instructions } from "./instructions";
import { InstructionDef } from "./types/interpreter";
import { compileInstruction } from "./parser"

function arraysEqual(a : string[], b : string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function compileCode(code: string) {
  console.log("COPILING: ", code)
  const tokenizedInstructions: InstructionTokenized[] = tokenizeCode(code);

  const compiledInstructions : Uint8Array[] = [];

  tokenizedInstructions.forEach((userInstruction, index) => {
    const foundInstructions : InstructionDef[] = instructions[userInstruction.instructionName];
    let match : InstructionDef | undefined;
    if (foundInstructions === undefined) {
      console.log(`Unknow instruction name "${userInstruction.instructionName}"`);
      return
    }
    if (foundInstructions.length > 1) {
      match = foundInstructions.find(foundInstruction => arraysEqual(foundInstruction.requiredTypes, userInstruction.argsTypes)) 
    }else{
      match = foundInstructions[0]
    }
    if (!match) {
      console.log(`No instruction ${userInstruction.instructionName} found using argument types: ${userInstruction.argsTypes}`)
      return;
    }
    // check if the called function has it's own compilation function (for custom instructions)
    if (typeof match.compileFunction === "function") {
      compiledInstructions.push(match.compileFunction(userInstruction.args))
    } else {
      compiledInstructions.push(compileInstruction(match, userInstruction.args))
    }
  }) 
  const totalLength = compiledInstructions.reduce((acc, curr) => acc + curr.length, 0);
  const finalROM = new Uint8Array(totalLength);
  let offset = 0;
  for (const instructionBytes of compiledInstructions) {
    finalROM.set(instructionBytes, offset);
    offset += instructionBytes.length;
  }
  console.log("FINALLL: ", finalROM)
  return {romSize: totalLength, romData: finalROM};

}
