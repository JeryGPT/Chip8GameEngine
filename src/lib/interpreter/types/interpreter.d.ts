export interface InstructionDef {
  argsLayout: string[] | [];
  template: number;
  helper?: string;
  requiredTypes?: string[];

};
