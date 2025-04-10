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
//const testCode = "out1 = cycle(60);";
const testFilePath = path_1.default.join(__dirname, "../../test/test.genexpr");
const testCode = fs_1.default.readFileSync(testFilePath).toString();
const tree = parser.parse(testCode);
//console.log(testCode);
//console.log(tree.rootNode.toString());
function getSemanticTokens(text, tree) {
    const builder = new node_1.SemanticTokensBuilder();
    const lines = text.split('\n');
    function traverseTree(node) {
        switch (node.type) {
            case "function_declaration":
                const params = [];
                for (const child of node.children) {
                    if (child.type === 'identifier') {
                        const str = getTextAtNode(child);
                        console.log(`\nFunction name: ${str}`);
                    }
                    else if (child.type === 'function_declaration_parameter') {
                        const str = getTextAtNode(child);
                        params.push(str);
                    }
                }
                console.log(`Parameters: ${params.toString()}`);
                const bodyChildren = node.childrenForFieldName('body');
                console.log(`The body:\n${bodyChildren.toString()}`);
                for (const bodyChild of bodyChildren) {
                    if (bodyChild.type === 'expr_statement_list') {
                        for (const exprChild of bodyChild.children) {
                            console.log(`Expr child: ${exprChild}`);
                        }
                    }
                }
                break;
        }
        // Recursively iterate through all children of rootNode
        for (const child of node.children) {
            traverseTree(child);
        }
    }
    // Start at root node
    traverseTree(tree.rootNode);
    // Get the matching string of an indentifier node
    function getTextAtNode(node) {
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