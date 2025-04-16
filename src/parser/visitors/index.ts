import { FuncDefVisitor } from "./function-definition-visitor";
import { NodeVisitor } from "./types";

export const visitorRegistry: Record<string, NodeVisitor> = {
  'function_declaration': new FuncDefVisitor()
};
