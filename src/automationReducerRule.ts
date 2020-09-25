import * as ts from 'typescript';
import * as Lint from 'tslint';

import { ExtendedMetadata } from './utils/ExtendedMetadata';
import { ActionSourceFile } from './CodeStructure/ActionSourceFile';
import { ActionDefinitionCollection } from './CodeStructure/Collections/ActionDefinitionCollection';
import { PossibleActionDefinition } from './StateActionProcessor/PossibleActionDefinition';
import { ProcessingStateVariableDeclarationStatus } from './StateActionProcessor/ProcessingStateVariableDeclarationStatus';

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
        return this.applyWithWalker(new CompilerRulesWalker(sourceFile, this.getOptions()));
    }
}

export class CompilerRulesWalker extends Lint.RuleWalker {
    public static FAILURE_STRING = 'no multi-arg functions allowed';

    // The current action source file.
    private currentActionSourceFile: ActionSourceFile | undefined;

    /**
     * Flag to check if we have hit a variable declaration, that could potentially be an action definition.
     *
     * Logic:
     * Set to true when a variableDeclaration is hit, during the processing of this variable, if we hit a call expression that is 'createStateField',
     * we set this variable to be false.
     * Otherwise, while this flag is true, i.e. we started on a variable declaration traversal and now hit an ObjectDeclaration ({prop:value}), we mark it
     * as a potential action object. At that point it is checked if this is really an action.
     *
     */
    private processingActionPropertyDeclaration = false;
    private currentPossibleActionVariableDeclaration: ts.VariableDeclaration | undefined;

    // State machine for processing the variable declaration/call expression statements - to track which part of the statement we are processing
    private processingStateVariableDeclaration = new ProcessingStateVariableDeclarationStatus();

    // Action Source File collection
    // tslint:disable-next-line: prefer-readonly
    public actionSourceFileCollection: Map<string, ActionSourceFile> = new Map<string, ActionSourceFile>();

    // Printing variables.
    private printActionData = false;
    private printData = false;

    /***
     *  Track the current Source file that is being processed.
     */
    protected visitSourceFile(node: ts.SourceFile): void {
        const sourceFileName = node.fileName;

        //if (sourceFileName.indexOf('C:/m365/modules/host-mac/microsoft-search/') !== -1) {
            if (sourceFileName.indexOf('C:/m365/modules/host-mac/') !== -1) {
            this.currentActionSourceFile = this.actionSourceFileCollection.get(sourceFileName);

            // If this source file is being parsed the first time, keep a copy of it.
            if (!this.currentActionSourceFile) {
                this.currentActionSourceFile = new ActionSourceFile(node);
                this.actionSourceFileCollection.set(sourceFileName, this.currentActionSourceFile);
            }



            // As part of this visitor, will hit various property declarations
            super.visitSourceFile(node);
            this.printActionObjects();
        }
    }

    /***
     * When hit a variable declaration, we mark actionprocessing to be true, so when we hit an objectliteral
     * expression, we know this is inside the bounds of a variable declaration.
     */
    protected visitVariableDeclaration(node: ts.VariableDeclaration): void {
        // If hitting a variable declaration, we anticipate this could be an action defnition.
        this.processingActionPropertyDeclaration = true;
        this.currentPossibleActionVariableDeclaration = node;
        super.visitVariableDeclaration(node);
    }

    /**
      * ** Note: this is not the code that we are using today to print actions for test-cases.**
      * When we hit an object Declaration, we try to see if this is an action definition.

      *
      * Logic:
      * > if this.processingActionPropertyDeclaration to be true
      *
      * ObjectLiteral definition:
      * - A JavaScript object literal is a comma-separated list of name-value pairs wrapped in curly braces.
      * Object literals encapsulate data, enclosing it in a tidy package.
      *
     */
    protected visitObjectLiteralExpression(node: ts.ObjectLiteralExpression): void {
        if (this.processingActionPropertyDeclaration) {
            const possibleActionDefinition = new PossibleActionDefinition();
            possibleActionDefinition.enclosingVariableDeclaration = this.currentPossibleActionVariableDeclaration;
            possibleActionDefinition.enclosingObjectLiteralDefinition = node;

            if (possibleActionDefinition.isEnclosingObjectLiteralActionDefinition()) {
                ActionDefinitionCollection.addActionDefinitionVariableDeclaration(possibleActionDefinition);
            }
        } else if (this.processingStateVariableDeclaration.processingOn) {
            // will come here if createStateField was hit, at that point we already know that this is not an
            // Action definition. (we know this is coming from createStateField, as processingOn is set to true)

            // hit processingObjectLiteral as part of the 'createStateField' traversal.
            this.processingStateVariableDeclaration.processingObjectLiteral = true;
            this.processingStateVariableDeclaration.processingOn = false;
        }
        super.visitObjectLiteralExpression(node);
    }

    /***
     * A property assignment is an actual setting of a property e.g. key: Value is a propertyAssignment
     *
     * We use this node for state variable processing. When we are in the createStateTraversal.
     * The createStateField method's second argument is a handler:
     * handlers: { [key: string]: ReducerFunction<S> }
     *
     * > So if we know we are traversing createStateField
     * > And have hit an objectLiteral expression, { [key: string]: ReducerFunction<S> }
     * > We watch out for propertyAssignment to turn on the flag that we are processing property assignment.
     * This is helpful as now in the children when we hit the PropertyAccessExpression, we use that value to extract action data
     * affecting this state variable.
     */
    protected visitPropertyAssignment(node: ts.PropertyAssignment): void {
        if (this.processingStateVariableDeclaration.processingObjectLiteral) {
            this.processingStateVariableDeclaration.processingPropertyAssignment = true;
        }
        super.visitPropertyAssignment(node);
    }

    /**
     * Logic:
     * > To be sure that we are looking at actions affecting state variables, we look at our flag.
     * If we are processing a propertyAssignment (i.e. the handler part of the createStateField), then
     * we parse the action name and store it.
     *
     * Also, full node is passed into ActionSourceFile object to store the data about this node.     *
     *
     * @param node this is a propertAccess example: objectName.property
     */
    protected visitPropertyAccessExpression(node: ts.PropertyAccessExpression): void {
        if (this.processingStateVariableDeclaration.processingPropertyAssignment) {
            const actionFullName = node.expression.getFullText() + '.' + node.name.text;

            // Full node is passed into ActionSourceFile object to store the data about this node.
            (this.currentActionSourceFile as ActionSourceFile).addActionForStateVariable(actionFullName, node);
            this.processingStateVariableDeclaration.processingPropertyAssignment = false;
        }
        super.visitPropertyAccessExpression(node);
    }

    /***
     * Call Expressions are calls to methods, so in case of call expressions that start with 'createStateField', we know there is a state variable in process
     */
    protected visitCallExpression(node: ts.CallExpression): void {
        // If the call is to 'CreateStateField', parse out the Identifier, that is the State variable name.
        if (node.expression.getText() === 'createStateField') {
            //ProcessingActionDeclaration is true when we visit a Variable Declaration.
            // Since we are in a call expression that was part of the VariableDeclaration, we need to turn  ProcessingActionDeclaration
            // To be false here.
            this.processingActionPropertyDeclaration = false;

            if (this.currentActionSourceFile) {
                // This is just createStateField call
                this.currentActionSourceFile.addCreateStateIdentifier(node.expression as ts.Identifier);

                // This is the full Variable Declaration for the State object.
                this.currentActionSourceFile.addCreateActionTypes(node.parent as ts.VariableDeclaration, true);

                // Flag that we can use for processing other object literals etc.
                this.processingStateVariableDeclaration.processingOn = true;
            }
        }
        super.visitCallExpression(node);
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

    protected walkChildren(node: ts.Node): void {
        super.walkChildren(node);

        // After having finished walking the children of the node (i.e. processing the call Expressions), if we were
        // Processing the call expression, then reset the processingOn capability
        if (node.kind === ts.SyntaxKind.CallExpression) {
            if (this.processingStateVariableDeclaration.processingOn) {
                this.processingStateVariableDeclaration.reset();
            }
        }
        if (node.kind === ts.SyntaxKind.VariableDeclaration) {
            this.processingActionPropertyDeclaration = false;

            //If we were hitting the call expressions, reset those too
            this.processingStateVariableDeclaration.reset();
        }
    }

    public printActionObjects(): void {
        this.actionSourceFileCollection.forEach((value: ActionSourceFile, _key: string) => {
                value.print();
        });
    }

    private print(data: string): void {
        if (this.printData) {
            console.log(data);
        }
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
