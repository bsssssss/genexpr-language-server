"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenTypesLegend = exports.TokenTypes = void 0;
exports.getSemanticTokens = getSemanticTokens;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const node_1 = require("vscode-languageserver/node");
var TokenTypes;
(function (TokenTypes) {
    TokenTypes[TokenTypes["Parameter"] = 0] = "Parameter";
})(TokenTypes || (exports.TokenTypes = TokenTypes = {}));
//export enum TokenModifiers {
//  Declaration,
//  Definition
//}
exports.tokenTypesLegend = [
    'parameter'
];
const parser = new tree_sitter_1.default();
const genexprPath = path_1.default.resolve("/Users/bss/Code/git/bsssssss/tree-sitter-genexpr");
const GenExpr = require(genexprPath);
parser.setLanguage(GenExpr);
//const testCode = "out1 = cycle(60);";
const testFilePath = path_1.default.join(__dirname, "../../test/test.genexpr");
const testCode = fs_1.default.readFileSync(testFilePath).toString();
const tree = parser.parse(testCode);
//console.log(testCode);
//console.log(tree.rootNode.toString());
function getSemanticTokens(text, tree) {
    const builder = new node_1.SemanticTokensBuilder();
    const lines = text.split('\n');
    function traverseNode(node) {
        const startPos = node.startPosition;
        const endPos = node.endPosition;
        switch (node.type) {
            case "function_declaration":
                const name = node.childForFieldName('name');
                if (name) {
                    const nameStr = identifierToString(name);
                    console.log(`Function name: ${nameStr}`);
                }
                const params = node.childrenForFieldName('parameters');
                const paramsStr = [];
                if (params) {
                    for (const param of params) {
                        const paramName = identifierToString(param);
                        if (paramName !== ',') {
                            console.log(`Param: ${paramName}`);
                            paramsStr.push(paramName);
                        }
                    }
                }
                break;
            case 'identifier':
                const parent = node.parent;
                console.log(parent === null || parent === void 0 ? void 0 : parent.type);
        }
        // Recursively iterate through all children of rootNode
        for (const child of node.children) {
            traverseNode(child);
        }
    }
    // Start at root node
    traverseNode(tree.rootNode);
    // Get the matching string of an indentifier node
    function identifierToString(node) {
        const line = node.startPosition.row;
        const startChar = node.startPosition.column;
        const endChar = node.endPosition.column;
        // Get the string matching the identifier
        const str = lines[line].slice(startChar, endChar);
        return str;
    }
    return builder.build();
}
getSemanticTokens(testCode, tree);
//# sourceMappingURL=parser.js.map