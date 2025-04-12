import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  MessageType,
  InitializeParams,
  InitializeResult,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import logger from "../utils/logger";
import { getSemanticTokens, tokenModifiersLegend, tokenTypesLegend } from "./semanticTokens";

/////////////////////////////////////////////////////////////////////////////////

logger.info(".".repeat(30) + "Starting server" + ".".repeat(30));

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

documents.onDidOpen((event) => {
  logger.info("A document was opened: " + event.document.uri);

  connection.sendNotification('window/showMessage', {
    type: MessageType.Info,
    message: "Lets GENerate stuff"
  });
});

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;
  //console.log(capabilities);

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: {
        openClose: true,
        change: TextDocumentSyncKind.Incremental
      },
      semanticTokensProvider: {
        legend: {
          tokenTypes: tokenTypesLegend,
          tokenModifiers: tokenModifiersLegend
        },
        full: true
      }
    },
  }
  return result;
})

connection.languages.semanticTokens.on((params) => {
  const genexprDocument = documents.get(params.textDocument.uri);
  if (!genexprDocument) {
    return { data: [] };
  }
  return getSemanticTokens(genexprDocument);
})

documents.listen(connection);
connection.listen();
