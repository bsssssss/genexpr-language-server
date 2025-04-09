"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const logger_1 = __importDefault(require("../utils/logger"));
//////////////////////////////////////////////////////////////
logger_1.default.start();
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
documents.onDidOpen((event) => {
    logger_1.default.info("Genexpr buffer : " + event.document.uri);
    connection.sendNotification('window/showMessage', {
        type: node_1.MessageType.Info,
        message: "Lets GENerate sounds and stuff"
    });
});
documents.listen(connection);
connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: node_1.TextDocumentSyncKind.Incremental
            },
        }
    };
});
connection.listen();
//# sourceMappingURL=server.js.map