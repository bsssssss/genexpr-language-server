import path from 'path';
import Parser from 'tree-sitter';
import { TextDocument } from 'vscode-languageserver-textdocument';

export const parser = new Parser();
const genexprPath = path.resolve("/Users/bss/Code/git/bsssssss/tree-sitter-genexpr");
const GenExpr: Parser.Language = require(genexprPath);
parser.setLanguage(GenExpr);

class SyntaxTreeManager {
  private documentTrees = new Map<string, Parser.Tree>();
  private documentVersions = new Map<string, number>();
  
  constructor(private parser: Parser) {}
  
  parseDocument(document: TextDocument): Parser.Tree {
    const uri = document.uri;
    const version = document.version;
    const oldTree = this.documentTrees.get(uri);
    
    // Si nous avons un arbre précédent et que le document a changé
    if (oldTree && this.documentVersions.get(uri) !== version) {
      // Analyse incrémentale
      const newTree = this.parser.parse(document.getText(), oldTree);
      this.documentTrees.set(uri, newTree);
      this.documentVersions.set(uri, version);
      return newTree;
    } 
    // Premier parsing ou pas d'arbre précédent
    else if (!oldTree) {
      const newTree = this.parser.parse(document.getText());
      this.documentTrees.set(uri, newTree);
      this.documentVersions.set(uri, version);
      return newTree;
    }
    
    // Document pas modifié, retourner l'arbre existant
    return oldTree;
  }
  
  invalidateDocument(uri: string): void {
    this.documentTrees.delete(uri);
    this.documentVersions.delete(uri);
  }
}

export const treeManager = new SyntaxTreeManager(parser);
