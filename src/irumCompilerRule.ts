import * as ts from 'typescript';
import * as Lint from 'tslint';

import * as tsutils from 'tsutils';
import { ExtendedMetadata } from './utils/ExtendedMetadata';
import { ActionSourceFile } from './CodeStructure/ActionObjectCollection';

export class Rule extends Lint.Rules.AbstractRule {
    public static metadata: ExtendedMetadata = {
        ruleName: 'irum-compiler',
        type: 'maintainability',
        description: 'IRUM FHL',
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

class ProcessingStateVariableDeclarationStatus {
    public processingOn = false;
    public processingObjectLiteral = false;
    public processingPropertyAssignment = false;

    public reset(): void {
        this.processingOn = false;
        this.processingObjectLiteral = false;
        this.processingPropertyAssignment = false;
    }
}

class PossibleActionDefinition {
    public enclosingVariableDeclaration: ts.VariableDeclaration;
    public enclosingObjectLiteralDefinition: ts.ObjectLiteralExpression;
    public typeDeclaration: ts.PropertyAssignment;
    public payloadDeclaration: ts.PropertyAssignment;

    public isEnclosingObjectLiteralActionDefinition(): boolean {
        // Object literal expression has 2 properties and each is a property assignment.
        const objectProperties = this.enclosingObjectLiteralDefinition.properties;
        if (objectProperties && objectProperties.length === 2) {
            if (
                objectProperties[0].kind === ts.SyntaxKind.PropertyAssignment &&
                objectProperties[1].kind === ts.SyntaxKind.PropertyAssignment
            ) {
                this.typeDeclaration = objectProperties[0];

                if (this.isPropertyAssignmentType()) {
                    this.payloadDeclaration = objectProperties[1];
                    return this.isPropertyAssignmentPayload();
                }
            }
        }

        return false;
    }

    private isPropertyAssignmentType() {
        return this.typeDeclaration.name.getText() === 'type';
    }

    private isPropertyAssignmentPayload() {
        return this.typeDeclaration.name.getText() === 'payload';
    }
}

class RulesWalker extends Lint.RuleWalker {
    public static FAILURE_STRING = 'no multi-arg functions allowed';

    private printActionData = false;
    private printData = false;

    private processingStateVariableDeclaration = new ProcessingStateVariableDeclarationStatus();

    // Processing action variable declaration
    private processingActionPropertyDeclaration = false;

    // tslint:disable-next-line: prefer-readonly
    private actionSourceFileCollection: Map<string, ActionSourceFile> = new Map<string, ActionSourceFile>();

    private currentActionSourceFile: ActionSourceFile;

    protected visitSourceFile(node: ts.SourceFile): void {
        const sourceFileName = node.fileName;

        this.currentActionSourceFile = this.actionSourceFileCollection.get(sourceFileName);

        if (!this.currentActionSourceFile) {
            this.currentActionSourceFile = new ActionSourceFile(node);
            this.actionSourceFileCollection.set(sourceFileName, this.currentActionSourceFile);
        }

        if (
            sourceFileName.indexOf(
                'C:/Users/igodil.REDMOND/Source/Repos/M365AdminUX/src/microsoft-search/connectors/addConnector-wizard/addConnectorWizard.redux.ts'
            ) !== -1
        ) {
            this.printActionData = true;
        } else {
            this.printActionData = false;
        }

        this.print('<table>');
        this.print('<tr><td><div class="source">SourceFile: ' + sourceFileName + '</div></td></tr>');

        super.visitSourceFile(node);

        if (this.printActionData) {
            this.printActionObjects();
        }
        this.print('</table>');
    }

    private printActionObjects(): void {
        this.actionSourceFileCollection.forEach((value: ActionSourceFile, _key: string) => {
            value.print();
        });
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

    protected walkChildren(node: ts.Node): void {
        super.walkChildren(node);

        if (node.kind === ts.SyntaxKind.CallExpression) {
            if (this.processingStateVariableDeclaration.processingOn) {
                this.processingStateVariableDeclaration.reset();
            }
        }
        if (node.kind === ts.SyntaxKind.VariableDeclaration) {
            this.processingActionPropertyDeclaration = false;
        }
    }

    protected visitCallExpression(node: ts.CallExpression): void {
        if (node.expression.getText() === 'createStateField') {
            if (this.currentActionSourceFile) {
                this.currentActionSourceFile.addCreateStateIdentifier(node.expression as ts.Identifier);
                this.currentActionSourceFile.addCreateActionTypes(node.parent as ts.VariableDeclaration, true);

                // Flag that we can use for processing other object literals etc.
                this.processingStateVariableDeclaration.processingOn = true;
            }
        }
        super.visitCallExpression(node);
    }

    protected visitObjectLiteralExpression(node: ts.ObjectLiteralExpression): void {
        if (this.processingActionPropertyDeclaration) {
            const possibleActionDefinition = new PossibleActionDefinition();
            possibleActionDefinition.enclosingObjectLiteralDefinition = node;

            if (possibleActionDefinition.isEnclosingObjectLiteralActionDefinition()) {
                console.log('Found action definition: ');
            }
        } else if (this.processingStateVariableDeclaration.processingOn) {
            this.processingStateVariableDeclaration.processingObjectLiteral = true;
            this.processingStateVariableDeclaration.processingOn = false;
        }
        super.visitObjectLiteralExpression(node);
    }

    protected visitPropertyAssignment(node: ts.PropertyAssignment): void {
        if (this.processingStateVariableDeclaration.processingObjectLiteral) {
            this.processingStateVariableDeclaration.processingPropertyAssignment = true;
        }
        super.visitPropertyAssignment(node);
    }

    protected visitPropertyAccessExpression(node: ts.PropertyAccessExpression): void {
        if (this.processingStateVariableDeclaration.processingPropertyAssignment) {
            const actionFullName = node.expression.getFullText() + '.' + node.name.text;
            (this.currentActionSourceFile as ActionSourceFile).addActionForStateVariable(actionFullName, node);
            this.processingStateVariableDeclaration.processingPropertyAssignment = false;
        }
        super.visitPropertyAccessExpression(node);
    }

    protected visitVariableDeclaration(node: ts.VariableDeclaration): void {
        this.processingActionPropertyDeclaration = true;
        super.visitVariableDeclaration(node);
    }

    protected visitPropertyDeclaration(node: ts.PropertyDeclaration): void {
        super.visitPropertyDeclaration(node);
    }

    protected visitIdentifier(node: ts.Identifier): void {
        this.print('<tr><td>visitIdentifier: ' + node.text);

        if (node.text === 'createActionTypes') {
            if (this.currentActionSourceFile) {
                this.currentActionSourceFile.addCreateActionTypes(node.parent as ts.VariableDeclaration);
            }
        }

        super.visitIdentifier(node);

        // Reset Flag that we can use for processing other object literals etc.
        // this.processingStateVariableDeclaration =  false;
        this.print('</td></tr>');
    }

    protected visitMethodDeclaration(node: ts.MethodDeclaration): void {
        this.print('<tr><td>visitMethodDeclaration: ' + node.name);
        super.visitMethodDeclaration(node);
        this.print('</td></tr>');
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
    }

    private print(data: string): void {
        if (this.printData) {
            console.log(data);
        }
    }
}
