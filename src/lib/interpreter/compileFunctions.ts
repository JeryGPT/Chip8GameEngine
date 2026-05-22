import { off } from "process";
import { InstructionTokenized } from "./types/tokenizer";

export function compileDB(args: number[]): Uint8Array {
  const bitArr = new Uint8Array(args); 
  console.log(bitArr, "COMPILE FUNCTION");
  return bitArr;
}