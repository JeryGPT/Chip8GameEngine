import { InstructionTokenized } from "./types/tokenizer";

export function tokenizeCode(code: string) {
  const lines = code.split("\n")
  const instructions : InstructionTokenized[] = [];
  const jumpLabels: Record<string, number> = {};
  const cleanLines : string[] = [];
  let currentAddr = 0x200;
  lines.forEach((rawInstruction, idx) => {
      let instruction = rawInstruction.split(";")[0].trim();
      if (instruction == "") return;
      if (instruction.endsWith(":")) {
        jumpLabels[instruction.slice(0, -1)] = currentAddr;
      }else{
        cleanLines.push(instruction);
        currentAddr += 2;
      }
  })

  cleanLines.forEach((instruction) => {
    if (instruction == "") return
    const instructionData : InstructionTokenized = {instructionName: "", args: [], argsTypes: []};
    const instructionName = instruction.split(" ")[0];
    if (instructionName == ""){
      return;
    }
    instructionData.instructionName = instructionName;
    const args = instruction.replace(instructionName, "")
      .replaceAll(" ", "")
      .split(",")
      .filter(arg => arg != "")
    


    args.forEach((arg, index) => {
      if (arg[0].toUpperCase() == "V"){
        //instructionData.args.push(!isNaN(Number(arg.split("V")[1])) ? Number(arg.split("V")[1]) : Number("0x"+ arg.split("V")[1]));
        const regNum = parseInt(arg.substring(1), 16);
    
        instructionData.args.push(regNum);
        instructionData.argsTypes.push("REGISTER")
    
      }else if (arg.toUpperCase() == "I"){
        instructionData.args.push(0);
        instructionData.argsTypes.push("INDEX_REGISTER")
      }else if (arg.toUpperCase() == "[I]"){
        instructionData.args.push(0);
        instructionData.argsTypes.push("INDEX_REGISTER_VALUE")
      }else if (arg.toUpperCase() == "ST"){
        instructionData.args.push(0);
        instructionData.argsTypes.push("SOUND_TIMER")
      }else if (arg.toUpperCase() == "DT"){
        instructionData.args.push(0);
        instructionData.argsTypes.push("DELAY_TIMER")
      }else if (arg.toUpperCase() == "K"){
        instructionData.args.push(0);
        instructionData.argsTypes.push("KEY")
      }else if (arg.toUpperCase() == "F"){
        instructionData.args.push(0);
        instructionData.argsTypes.push("FONT_SPECIFIER")
      }else if (jumpLabels[arg] !== undefined) {
        instructionData.args.push(jumpLabels[arg.trim()])
        instructionData.argsTypes.push("NUMBER");
      
      }else if (!isNaN(Number(arg))) {
      
        instructionData.args.push(Number(arg));
        instructionData.argsTypes.push("NUMBER")
      }
      
    })
    instructions.push(instructionData);

  })
  return instructions
}
