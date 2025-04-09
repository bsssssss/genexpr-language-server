import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  MessageType,
  SemanticTokenTypes,
  InitializeParams,
  InitializeResult,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

//import { Parser } from 'web-tree-sitter';
import Parser from 'tree-sitter';

import logger from "../utils/logger";
import path from "path";

logger.start();

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

documents.onDidOpen((event) => {
  logger.info("Genexpr buffer : " + event.document.uri);

  connection.sendNotification('window/showMessage', {
    type: MessageType.Info,
    message: "Lets GENerate stuff"
  });
});

documents.listen(connection);

const tokenTypes = [
  SemanticTokenTypes.parameter,
  SemanticTokenTypes.variable
]

connection.onInitialize((params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: {
        openClose: true,
        change: TextDocumentSyncKind.Incremental
      },
    semanticTokensProvider: {
        legend: {
          tokenTypes,
          tokenModifiers: []
        },
        full: true
      }
    },
  }
});

connection.listen();
