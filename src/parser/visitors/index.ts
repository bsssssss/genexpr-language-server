import { FunctionDeclVisitor } from "./function-declaration-visitor";
import { NodeVisitor } from "./types";

export const visitorRegistry: Record<string, NodeVisitor> = {
  'function_declaration': new FunctionDeclVisitor()
};
