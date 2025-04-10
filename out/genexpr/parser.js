"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenTypesLegend = exports.TokenModifiers = exports.TokenTypes = void 0;
exports.getSemanticTokens = getSemanticTokens;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const node_1 = require("vscode-languageserver/node");
var TokenTypes;
(function (TokenTypes) {
    TokenTypes[TokenTypes["Function"] = 0] = "Function";
    TokenTypes[TokenTypes["Parameter"] = 1] = "Parameter";
})(TokenTypes || (exports.TokenTypes = TokenTypes = {}));
var TokenModifiers;
(function (TokenModifiers) {
    TokenModifiers[TokenModifiers["Declaration"] = 0] = "Declaration";
    TokenModifiers[TokenModifiers["Definition"] = 1] = "Definition";
})(TokenModifiers || (exports.TokenModifiers = TokenModifiers = {}));
exports.tokenTypesLegend = [
    'function',
    'parameter'
];
const parser = new tree_sitter_1.default();
const genexprPath = path_1.default.resolve("/Users/bss/Code/git/bsssssss/tree-sitter-genexpr");
const GenExpr = require(genexprPath);
parser.setLanguage(GenExpr);
const testFilePath = path_1.default.join(__dirname, "../../test/test.genexpr");
const testCode = fs_1.default.readFileSync(testFilePath).toString();
const tree = parser.parse(testCode);
/////////////////////////////////////////////////////////////////////////////////
function getSemanticTokens(text, tree) {
    const builder = new node_1.SemanticTokensBuilder();
    // Start at root node
    traverseTree(tree.rootNode, text, builder);
    return builder.build();
}
function traverseTree(node, text, builder) {
    if (node.type === 'function_declaration') {
        const params = [];
        for (const paramNode of node.childrenForFieldName('parameters')) {
            if (paramNode.type === 'function_declaration_parameter') {
                params.push(paramNode.text);
            }
        }
        console.log(`Params: ${params.toString()}`);
        for (const bodyNode of node.childrenForFieldName('body')) {
            if (bodyNode.type === 'expr_statement_list') {
                console.log(`Body:\n${bodyNode.text}`);
            }
        }
    }
    // Recursively iterate through all children of rootNode
    for (const child of node.children) {
        traverseTree(child, text, builder);
    }
}
getSemanticTokens(testCode, tree);
//# sourceMappingURL=parser.js.map