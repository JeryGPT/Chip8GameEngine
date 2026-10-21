import { CompileDiagnostic } from "./types/compiler";


export interface InstructionTokenized {
  instructionName: string;
  args: number[];
  argsTypes: string[];
  line: number;
}

export interface TokenizeResult {
  success: number;
  data: InstructionTokenized[];
  diagnostics: CompileDiagnostic[];
}