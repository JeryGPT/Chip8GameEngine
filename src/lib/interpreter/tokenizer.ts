import { getFromProject } from "./projectData";
import { InstructionTokenized } from "./types/tokenizer";

export function tokenizeCode(code: string) {
  const lines = code.split("\n")
  const instructions: InstructionTokenized[] = [];
  const jumpLabels: Record<string, number> = {};
  const cleanLines: string[] = [];
  let currentAddr = 0x200;
  lines.forEach((rawInstruction, idx) => {
    let instruction = rawInstruction.split(";")[0].trim();
    const matchResult = instruction.match(/project\.[\w.]+/);

    const projectPath: string | null = matchResult ? matchResult[0] : null;

    if (projectPath) {
      const dataFromPath = getFromProject(projectPath, "123");

      const replacementValue = dataFromPath?.success === 1 ? dataFromPath.data : "";

      instruction = instruction.replace(projectPath, replacementValue);
      console.log("DAFGESOIUP: ", instruction)
    }


    if (instruction == "") return;
    if (instruction.endsWith(":")) {
      jumpLabels[instruction.slice(0, -1)] = currentAddr;

    } else {
      if (instruction == "") return;
      cleanLines.push(instruction);
      let parts = instruction.split(" ");
      const name = parts[0].toUpperCase();
      if (name === "DB") {
        // DB directive takes 1 byte per argument element
        const elementCount = instruction.replace(name, "").trim().replace(" ", "").split(",").length;
        console.log("ELEMENT COUNTL ", elementCount)
        currentAddr += elementCount;
      } else {
        currentAddr += 2;
      }
    }
  })

  cleanLines.forEach((instruction) => {
    if (instruction == "") return
    const instructionData: InstructionTokenized = { instructionName: "", args: [], argsTypes: [] };
    const instructionName = instruction.split(" ")[0];
    if (instructionName == "") {
      return;
    }
    instructionData.instructionName = instructionName;
    const args = instruction.replace(instructionName, "")
      .replaceAll(" ", "")
      .split(",")
      .filter(arg => arg != "")



    args.forEach((arg, index) => {
      if (arg[0].toUpperCase() == "V") {
        //instructionData.args.push(!isNaN(Number(arg.split("V")[1])) ? Number(arg.split("V")[1]) : Number("0x"+ arg.split("V")[1]));
        const regNum = !isNaN(Number(arg.split("V")[1])) ? Number(arg.split("V")[1]) : parseInt("0x" + arg.split("V")[1], 16)

        instructionData.args.push(regNum);
        instructionData.argsTypes.push("REGISTER")

      } else if (arg.toUpperCase() == "I") {
        instructionData.args.push(0);
        instructionData.argsTypes.push("INDEX_REGISTER")
      } else if (arg.toUpperCase() == "[I]") {
        instructionData.args.push(0);
        instructionData.argsTypes.push("INDEX_REGISTER_VALUE")
      } else if (arg.toUpperCase() == "ST") {
        instructionData.args.push(0);
        instructionData.argsTypes.push("SOUND_TIMER")
      } else if (arg.toUpperCase() == "DT") {
        instructionData.args.push(0);
        instructionData.argsTypes.push("DELAY_TIMER")
      } else if (arg.toUpperCase() == "K") {
        instructionData.args.push(0);
        instructionData.argsTypes.push("KEY")
      } else if (arg.toUpperCase() == "F") {
        instructionData.args.push(0);
        instructionData.argsTypes.push("FONT_SPECIFIER")
      } else if (jumpLabels[arg] !== undefined) {
        instructionData.args.push(jumpLabels[arg.trim()])
        instructionData.argsTypes.push("NUMBER");

      } else if (!isNaN(Number(arg))) {

        instructionData.args.push(Number(arg));
        instructionData.argsTypes.push("NUMBER")
      }

    })
    instructions.push(instructionData);
    console.log(instructionData)

  })
  return { success: 1, data: instructions }
}
