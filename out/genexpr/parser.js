"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const parser = new tree_sitter_1.default();
const genexprPath = path_1.default.resolve("/Users/bss/Code/git/bsssssss/tree-sitter-genexpr");
const GenExpr = require(genexprPath);
parser.setLanguage(GenExpr);
//const testCode = "out1 = cycle(60);";
const testFilePath = path_1.default.join(__dirname, "../../test/test.genexpr");
const testCode = fs_1.default.readFileSync(testFilePath).toString();
const tree = parser.parse(testCode);
console.log(testCode);
console.log(tree.rootNode.toString());
//function getSemanticTokens
//# sourceMappingURL=parser.js.map