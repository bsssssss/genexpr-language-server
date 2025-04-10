"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenTypesLegend = exports.TokenModifiers = exports.TokenTypes = void 0;
exports.getSemanticTokens = getSemanticTokens;
const path_1 = __importDefault(require("path"));
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
//const testFilePath = path.join(__dirname, "../../test/test.genexpr")
//const testCode = fs.readFileSync(testFilePath).toString();
/////////////////////////////////////////////////////////////////////////////////
function getSemanticTokens(document) {
    const tree = parser.parse(document.getText());
    const builder = new node_1.SemanticTokensBuilder();
    // Start at root node
    traverseTree(tree.rootNode, builder);
    return builder.build();
}
function traverseTree(node, builder) {
    if (node.type === 'function_declaration') {
        const params = [];
        for (const paramNode of node.childrenForFieldName('parameters')) {
            if (paramNode.type === 'function_declaration_parameter') {
                params.push(paramNode.text);
            }
        }
        //console.log(`Params: ${params.toString()}`);
        for (const bodyNode of node.childrenForFieldName('body')) {
            let identifiersInBody = [];
            if (bodyNode.type === 'expr_statement_list') {
                identifiersInBody = collectIdentifiers(bodyNode);
            }
            for (const identifierInBody of identifiersInBody) {
                if (params.includes(identifierInBody.text)) {
                    //console.log(`Found match in body: ${identifierInBody.text}`);
                    builder.push(identifierInBody.startPosition.row, identifierInBody.startPosition.column, identifierInBody.text.length, TokenTypes.Parameter, 0);
                }
            }
        }
    }
    // Recursively iterate through all children of rootNode
    for (const child of node.children) {
        traverseTree(child, builder);
    }
}
function collectIdentifiers(node) {
    let identifiers = [];
    if (node.type === 'identifier') {
        identifiers.push(node);
    }
    for (const child of node.children) {
        if (child) {
            identifiers = identifiers.concat(collectIdentifiers(child));
        }
    }
    return identifiers;
}
//getSemanticTokens(testCode, tree);
//# sourceMappingURL=parser.js.map