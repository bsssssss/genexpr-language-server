```typescript
// Classe de base abstraite pour tous les visiteurs
abstract class BaseNodeVisitor implements NodeVisitor {
  abstract visit(node: Parser.SyntaxNode, builder: SemanticTokensBuilder): void;
  
  // Méthodes utilitaires communes
  protected pushToken(
    node: Parser.SyntaxNode, 
    builder: SemanticTokensBuilder, 
    tokenType: TokenTypes, 
    tokenModifier: number = 0
  ): void {
    builder.push(
      node.startPosition.row,
      node.startPosition.column,
      node.text.length,
      tokenType,
      tokenModifier
    );
  }
  
  // Autres méthodes utilitaires...
}

// Visiteur pour les déclarations de fonction
class FunctionDeclarationVisitor extends BaseNodeVisitor {
  visit(node: Parser.SyntaxNode, builder: SemanticTokensBuilder): void {
    // Traitement du nom de la fonction
    const nameNode = node.childForFieldName('name');
    if (nameNode) {
      this.pushToken(nameNode, builder, TokenTypes.Function, TokenModifiers.Definition);
    }
    
    // Traitement des paramètres
    const params = this.extractParameters(node);
    
    // Traitement du corps
    this.processBody(node, params, builder);
  }
  
  private extractParameters(node: Parser.SyntaxNode): string[] {
    const params: string[] = [];
    for (const paramNode of node.childrenForFieldName('parameters')) {
      if (paramNode.type === 'function_declaration_parameter') {
        // Aussi marquer les paramètres comme tels
        params.push(paramNode.text);
      }
    }
    return params;
  }
  
  private processBody(node: Parser.SyntaxNode, params: string[], builder: SemanticTokensBuilder): void {
    for (const bodyNode of node.childrenForFieldName('body')) {
      if (bodyNode.type === 'expr_statement_list') {
        const identifiers = collectIdentifiers(bodyNode);
        
        for (const identifier of identifiers) {
          if (params.includes(identifier.text)) {
            this.pushToken(identifier, builder, TokenTypes.Parameter);
          }
        }
      }
    }
  }
}

// Registre des visiteurs
const visitorRegistry: Record<string, NodeVisitor> = {
  'function_declaration': new FunctionDeclarationVisitor(),
  // Ajouter d'autres visiteurs...
};

// Fonction principale de traversée
function traverseTree(node: Parser.SyntaxNode, builder: SemanticTokensBuilder): void {
  const visitor = visitorRegistry[node.type];
  if (visitor) {
    visitor.visit(node, builder);
  }
  
  // Continuer la traversée récursive
  for (const child of node.children) {
    traverseTree(child, builder);
  }
}
```
