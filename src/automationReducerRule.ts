import * as ts from 'typescript';
import * as Lint from 'tslint';

import { ExtendedMetadata } from './utils/ExtendedMetadata';
import { CompilerRulesWalker } from './irumCompilerRule';

export class Rule extends Lint.Rules.AbstractRule {
    public static metadata: ExtendedMetadata = {
        ruleName: 'automation-reducer',
        type: 'maintainability',
        description: 'State-Action Processor',
        options: null, // tslint:disable-line:no-null-keyword
        optionsDescription: '',
        typescriptOnly: true,
        issueClass: 'SDL',
        issueType: 'Error',
        severity: 'Critical',
        level: 'Mandatory',
        group: 'Clarity',
        commonWeaknessEnumeration: '...' // if possible, please map your rule to a CWE (see cwe_descriptions.json and https://cwe.mitre.org)
    };

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new RulesWalker(sourceFile, this.getOptions()));
    }
}

export class RulesWalker extends Lint.RuleWalker {
    public static printActions = true;
    public static FAILURE_STRING = 'no multi-arg functions allowed';

    /***
     *  Track the current Source file that is being processed.
     */
    protected visitSourceFile(node: ts.SourceFile): void {
        console.log('IRUMMMM');
        //if (RulesWalker.printActions) {
        // Prints all the action objects.
        CompilerRulesWalker.printActionObjects();
        console.log('IRUMMMM2');

        //            RulesWalker.printActions = false;
        //      }
    }

    /*
     protected visitMethodDeclaration(node: ts.MethodDeclaration): void {
        this.print('<tr><td>visitMethodDeclaration: ' + node.name);
        super.visitMethodDeclaration(node);
        this.print('</td></tr>');
    }

    protected visitAnyKeyword(node: ts.Node): void {
        this.print('<tr><td>visitAnyKeyword: ');
        super.visitAnyKeyword(node);
        this.print('</td></tr>');
    }

    protected visitClassDeclaration(node: ts.ClassDeclaration): void {
        this.print('<tr><td>visitClassDeclaration: ' + node.name);
        super.visitClassDeclaration(node);
        this.print('</td></tr>');
    }

    protected visitFunctionDeclaration(node: ts.FunctionDeclaration): void {
        this.print('<tr><td>visitFunctionDeclaration: ' + node.name);
        super.visitFunctionDeclaration(node);
        this.print('</td></tr>');
    }

    public visitArrowFunction(node: ts.ArrowFunction) {
        this.print('<tr><td>Arrow function: ' + node.name);
        super.visitArrowFunction(node);
        this.print('</td></tr>');
    }
      protected visitPropertyDeclaration(node: ts.PropertyDeclaration): void {
        super.visitPropertyDeclaration(node);
    }
    protected visitArrayLiteralExpression(node: ts.ArrayLiteralExpression): void {
        super.visitArrayLiteralExpression(node);
    }
    protected visitArrayType(node: ts.ArrayTypeNode): void {
        super.visitArrayType(node);
    }
    protected visitBinaryExpression(node: ts.BinaryExpression): void {
        super.visitBinaryExpression(node);
    }
    protected visitBindingElement(node: ts.BindingElement): void {
        super.visitBindingElement(node);
    }
    protected visitBindingPattern(node: ts.BindingPattern): void {
        super.visitBindingPattern(node);
    }
    protected visitBlock(node: ts.Block): void {
        super.visitBlock(node);
    }
    protected visitBreakStatement(node: ts.BreakOrContinueStatement): void {
        super.visitBreakStatement(node);
    }

    protected visitCallSignature(node: ts.SignatureDeclaration): void {
        super.visitCallSignature(node);
    }
    protected visitCaseClause(node: ts.CaseClause): void {
        super.visitCaseClause(node);
    }
    protected visitClassExpression(node: ts.ClassExpression): void {
        super.visitClassExpression(node);
    }
    protected visitCatchClause(node: ts.CatchClause): void {
        super.visitCatchClause(node);
    }
    protected visitConditionalExpression(node: ts.ConditionalExpression): void {
        super.visitConditionalExpression(node);
    }
    protected visitConstructSignature(node: ts.ConstructSignatureDeclaration): void {
        super.visitConstructSignature(node);
    }
    protected visitConstructorDeclaration(node: ts.ConstructorDeclaration): void {
        super.visitConstructorDeclaration(node);
    }
    protected visitConstructorType(node: ts.FunctionOrConstructorTypeNode): void {
        super.visitConstructorType(node);
    }
    protected visitContinueStatement(node: ts.BreakOrContinueStatement): void {
        super.visitContinueStatement(node);
    }
    protected visitDebuggerStatement(node: ts.Statement): void {
        super.visitDebuggerStatement(node);
    }
    protected visitDefaultClause(node: ts.DefaultClause): void {
        super.visitDefaultClause(node);
    }
    protected visitDoStatement(node: ts.DoStatement): void {
        super.visitDoStatement(node);
    }
    protected visitElementAccessExpression(node: ts.ElementAccessExpression): void {
        super.visitElementAccessExpression(node);
    }
    protected visitEndOfFileToken(node: ts.Node): void {
        super.visitEndOfFileToken(node);
    }
    protected visitEnumDeclaration(node: ts.EnumDeclaration): void {
        super.visitEnumDeclaration(node);
    }
    protected visitEnumMember(node: ts.EnumMember): void {
        super.visitEnumMember(node);
    }
    protected visitExportAssignment(node: ts.ExportAssignment): void {
        super.visitExportAssignment(node);
    }
    protected visitExpressionStatement(node: ts.ExpressionStatement): void {
        super.visitExpressionStatement(node);
    }
    protected visitForStatement(node: ts.ForStatement): void {
        super.visitForStatement(node);
    }
    protected visitForInStatement(node: ts.ForInStatement): void {
        super.visitForInStatement(node);
    }
    protected visitForOfStatement(node: ts.ForOfStatement): void {
        super.visitForOfStatement(node);
    }
    protected visitFunctionExpression(node: ts.FunctionExpression): void {
        super.visitFunctionExpression(node);
    }
    protected visitFunctionType(node: ts.FunctionOrConstructorTypeNode): void {
        super.visitFunctionType(node);
    }
    protected visitGetAccessor(node: ts.AccessorDeclaration): void {
        super.visitGetAccessor(node);
    }
    protected visitIfStatement(node: ts.IfStatement): void {
        super.visitIfStatement(node);
    }
    protected visitImportDeclaration(node: ts.ImportDeclaration): void {
        super.visitImportDeclaration(node);
    }
    protected visitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration): void {
        super.visitImportEqualsDeclaration(node);
    }
    protected visitIndexSignatureDeclaration(node: ts.IndexSignatureDeclaration): void {
        super.visitIndexSignatureDeclaration(node);
    }
    protected visitInterfaceDeclaration(node: ts.InterfaceDeclaration): void {
        super.visitInterfaceDeclaration(node);
    }
    protected visitJsxAttribute(node: ts.JsxAttribute): void {
        super.visitJsxAttribute(node);
    }
    protected visitJsxElement(node: ts.JsxElement): void {
        super.visitJsxElement(node);
    }
    protected visitJsxExpression(node: ts.JsxExpression): void {
        super.visitJsxExpression(node);
    }
    protected visitJsxSelfClosingElement(node: ts.JsxSelfClosingElement): void {
        super.visitJsxSelfClosingElement(node);
    }
    protected visitJsxSpreadAttribute(node: ts.JsxSpreadAttribute): void {
        super.visitJsxSpreadAttribute(node);
    }
    protected visitLabeledStatement(node: ts.LabeledStatement): void {
        super.visitLabeledStatement(node);
    }
    protected visitMethodSignature(node: ts.SignatureDeclaration): void {
        super.visitMethodSignature(node);
    }
    protected visitModuleDeclaration(node: ts.ModuleDeclaration): void {
        super.visitModuleDeclaration(node);
    }
    protected visitNamedImports(node: ts.NamedImports): void {
        super.visitNamedImports(node);
    }
    protected visitNamespaceImport(node: ts.NamespaceImport): void {
        super.visitNamespaceImport(node);
    }
    protected visitNewExpression(node: ts.NewExpression): void {
        super.visitNewExpression(node);
    }
    protected visitNonNullExpression(node: ts.NonNullExpression): void {
        super.visitNonNullExpression(node);
    }
    protected visitNumericLiteral(node: ts.NumericLiteral): void {
        super.visitNumericLiteral(node);
    }

    protected visitParameterDeclaration(node: ts.ParameterDeclaration): void {
        super.visitParameterDeclaration(node);
    }
    protected visitPostfixUnaryExpression(node: ts.PostfixUnaryExpression): void {
        super.visitPostfixUnaryExpression(node);
    }
    protected visitPrefixUnaryExpression(node: ts.PrefixUnaryExpression): void {
        super.visitPrefixUnaryExpression(node);
    }

    protected visitPropertySignature(node: ts.Node): void {
        super.visitPropertySignature(node);
    }
    protected visitRegularExpressionLiteral(node: ts.Node): void {
        super.visitRegularExpressionLiteral(node);
    }
    protected visitReturnStatement(node: ts.ReturnStatement): void {
        super.visitReturnStatement(node);
    }
    protected visitSetAccessor(node: ts.AccessorDeclaration): void {
        super.visitSetAccessor(node);
    }
    protected visitStringLiteral(node: ts.StringLiteral): void {
        super.visitStringLiteral(node);
    }
    protected visitSwitchStatement(node: ts.SwitchStatement): void {
        super.visitSwitchStatement(node);
    }
    protected visitTemplateExpression(node: ts.TemplateExpression): void {
        super.visitTemplateExpression(node);
    }
    protected visitThrowStatement(node: ts.ThrowStatement): void {
        super.visitThrowStatement(node);
    }
    protected visitTryStatement(node: ts.TryStatement): void {
        super.visitTryStatement(node);
    }
    protected visitTupleType(node: ts.TupleTypeNode): void {
        super.visitTupleType(node);
    }
    protected visitTypeAliasDeclaration(node: ts.TypeAliasDeclaration): void {
        super.visitTypeAliasDeclaration(node);
    }
    protected visitTypeAssertionExpression(node: ts.TypeAssertion): void {
        super.visitTypeAssertionExpression(node);
    }
    protected visitTypeLiteral(node: ts.TypeLiteralNode): void {
        super.visitTypeLiteral(node);
    }
    protected visitTypeReference(node: ts.TypeReferenceNode): void {
        super.visitTypeReference(node);
    }
    protected visitVariableDeclarationList(node: ts.VariableDeclarationList): void {
        super.visitVariableDeclarationList(node);
    }
    protected visitVariableStatement(node: ts.VariableStatement): void {
        super.visitVariableStatement(node);
    }
    protected visitWhileStatement(node: ts.WhileStatement): void {
        super.visitWhileStatement(node);
    }
    protected visitWithStatement(node: ts.WithStatement): void {
        super.visitWithStatement(node);
    }
    protected visitNode(node: ts.Node): void {
        super.visitNode(node);
    }*/
}
