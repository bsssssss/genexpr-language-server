"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const logger_1 = __importDefault(require("../utils/logger"));
const parser_1 = require("../genexpr/parser");
/////////////////////////////////////////////////////////////////////////////////
logger_1.default.info(".".repeat(30) + "Starting server" + ".".repeat(30));
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
documents.onDidOpen((event) => {
    logger_1.default.info("A document was opened: " + event.document.uri);
    connection.sendNotification('window/showMessage', {
        type: node_1.MessageType.Info,
        message: "Lets GENerate stuff"
    });
});
connection.onInitialize((params) => {
    return {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: node_1.TextDocumentSyncKind.Incremental
            },
            semanticTokensProvider: {
                legend: {
                    tokenTypes: parser_1.tokenTypesLegend,
                    tokenModifiers: []
                },
                full: true
            }
        },
    };
});
connection.languages.semanticTokens.on((params) => {
    const genexprDocument = documents.get(params.textDocument.uri);
    if (!genexprDocument) {
        return { data: [] };
    }
    return (0, parser_1.getSemanticTokens)(genexprDocument);
});
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map