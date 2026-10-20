export interface CompileDiagnostic {
  phase: "tokenizer" | "assembler";
  message: string;
  line?: number;
  severity: "error" | "warning";
}

export interface CompileResult {
    romSize: number;
    romData: Uint8Array | null;
    success: boolean;
    diagnostics: CompileDiagnostic[];
}