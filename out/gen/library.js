"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokens = exports.TokenModifiers = exports.TokenTypes = exports.TokenModifier = exports.TokenType = void 0;
exports.getSemanticTokens = getSemanticTokens;
const vscode_languageserver_1 = require("vscode-languageserver");
var TokenType;
(function (TokenType) {
    TokenType[TokenType["KEYWORD"] = 0] = "KEYWORD";
    TokenType[TokenType["OPERATOR"] = 1] = "OPERATOR";
    TokenType[TokenType["NUMBER"] = 2] = "NUMBER";
})(TokenType || (exports.TokenType = TokenType = {}));
var TokenModifier;
(function (TokenModifier) {
    TokenModifier[TokenModifier["DEFAULT_LIBRARY"] = 0] = "DEFAULT_LIBRARY";
    TokenModifier[TokenModifier["STATIC"] = 1] = "STATIC";
})(TokenModifier || (exports.TokenModifier = TokenModifier = {}));
exports.TokenTypes = [
    'keyword',
    'operator',
    'number'
];
exports.TokenModifiers = [
    'defaultLibrary',
    'static'
];
exports.Tokens = [
    {
        regexp: /\b(in\d*|out\d*)\b/g,
        type: TokenType.KEYWORD,
        modifier: TokenModifier.DEFAULT_LIBRARY
    },
    {
        regexp: /\b(History|Param)\b/g,
        type: TokenType.KEYWORD,
        modifier: TokenModifier.DEFAULT_LIBRARY
    },
    {
        regexp: /\b(if|else|for|while|break|continue)\b/g,
        type: TokenType.KEYWORD,
        modifier: TokenModifier.DEFAULT_LIBRARY
    },
    {
        regexp: /\b(return)\b/g,
        type: TokenType.KEYWORD,
        modifier: TokenModifier.DEFAULT_LIBRARY
    },
    {
        regexp: /[;,(){}\[\]=+\-/*|&!<>]/g,
        type: TokenType.OPERATOR,
        modifier: TokenModifier.DEFAULT_LIBRARY
    },
    {
        regexp: /(?<!\w)(-?(?:\d+(?:\.\d+)?|\.\d+))/g,
        type: TokenType.NUMBER,
        modifier: TokenModifier.STATIC
    }
];
function processLine(line, lineNumber, builder) {
    for (const token of exports.Tokens) {
        processPattern(line, lineNumber, builder, token);
    }
}
function processPattern(line, lineNumber, builder, token) {
    token.regexp.lastIndex = 0;
    let match;
    while ((match = token.regexp.exec(line)) !== null) {
        const startChar = match.index;
        const length = match[0].length;
        //logger.info(`Found token ${match[0]} at position ${startChar} and length ${length}`);
        builder.push(lineNumber, startChar, length, token.type, 1 << token.modifier);
    }
}
function getSemanticTokens(document) {
    const builder = new vscode_languageserver_1.SemanticTokensBuilder();
    const text = document.getText();
    const lines = text.split("\n");
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];
        processLine(line, lineNumber, builder);
    }
    return builder.build().data;
}
//# sourceMappingURL=library.js.map