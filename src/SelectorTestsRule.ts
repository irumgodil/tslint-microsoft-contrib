import * as ts from 'typescript';
import * as Lint from 'tslint';

import { ExtendedMetadata } from './utils/ExtendedMetadata';
import { SelectorsSourceFile } from './CodeStructure/SelectorsSourceFile';
import { ProcessingSelectorDeclarationStatus } from './StateActionProcessor/ProcessingSelectorDeclarationStatus';

export class Rule extends Lint.Rules.AbstractRule {
    public static metadata: ExtendedMetadata = {
        ruleName: 'selector-test',
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

class RulesWalker extends Lint.RuleWalker {
    public static FAILURE_STRING = 'no multi-arg functions allowed';

    // The current action source file.
    private currentSelectorSourceFile: SelectorsSourceFile | undefined;

    // State machine for processing the variable declaration/call expression statements - to track which part of the statement we are processing
    private processingSelectorDeclarationStatus = new ProcessingSelectorDeclarationStatus();

    // Action Source File collection
    // tslint:disable-next-line: prefer-readonly
    private selectorSourceFileCollection: Map<string, SelectorsSourceFile> = new Map<string, SelectorsSourceFile>();

    // Printing variables.
    private printSelectors = false;

    /***
     *  Track the current Source file that is being processed.
     */
    protected visitSourceFile(node: ts.SourceFile): void {
        const sourceFileName = node.fileName;
        this.currentSelectorSourceFile = this.selectorSourceFileCollection.get(sourceFileName);

        // If this source file is being parsed the first time, keep a copy of it.
        if (!this.currentSelectorSourceFile) {
            this.currentSelectorSourceFile = new SelectorsSourceFile(node);
            this.selectorSourceFileCollection.set(sourceFileName, this.currentSelectorSourceFile);
        }

        //   if (sourceFileName.indexOf('C:/Users/igodil.REDMOND/Source/Repos/M365AdminUX/src/microsoft-search/connectors/') !== -1) {
        if (sourceFileName.indexOf('redux') !== -1) {
            this.printSelectors = true;
        } else {
            this.printSelectors = false;
        }

        // As part of this visitor, will hit various property declarations
        super.visitSourceFile(node);

        if (this.printSelectors) {
            // Prints all the action objects.
            this.printSelectorElements();
        }
    }

    /***
     * When hit a variable declaration, we mark actionprocessing to be true, so when we hit an objectliteral
     * expression, we know this is inside the bounds of a variable declaration.
     */
    protected visitVariableDeclaration(node: ts.VariableDeclaration): void {
        // Keep track of this variable as we might need it later.
        this.processingSelectorDeclarationStatus.currentVariableBeingProcessed = node;
        super.visitVariableDeclaration(node);
    }

    /***
     * Call Expressions are calls to methods, so in case of call expressions that start with 'createStateField', we know there is a state variable in process
     */
    protected visitCallExpression(node: ts.CallExpression): void {
        // If the call is to 'createSelector', parse out the variable declaration
        if (node.expression.getText() === 'createSelector') {
            if (this.currentSelectorSourceFile) {
                // This is the full Variable Declaration for the createSelector call
                this.currentSelectorSourceFile.addCreateSelectorsNode(node.parent as ts.VariableDeclaration, node);
            }
        } else if (node.expression.getText() === 'state.getIn' && node.parent.kind === ts.SyntaxKind.ReturnStatement) {
            // We only parse this if this is a return statement, as other usages of this call could occcur at other points in the code.

            if (this.currentSelectorSourceFile) {
                // This is the full Variable Declaration for the createSelector call
                this.currentSelectorSourceFile.addStateSelectorsNode(this.processingSelectorDeclarationStatus
                    .currentVariableBeingProcessed as ts.VariableDeclaration);
            }
        }
        super.visitCallExpression(node);
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
        /*   if (this.processingSelectorDeclaration) {
            const possibleActionDefinition = new PossibleActionDefinition();
            possibleActionDefinition.enclosingObjectLiteralDefinition = node;

            if (possibleActionDefinition.isEnclosingObjectLiteralActionDefinition()) {
                //   console.log('Found action definition: ');
            }
        } else if (this.processingStateVariableDeclaration.processingOn) {
            // will come here if createStateField was hit, at that point we already know that this is not an
            // Action definition. (we know this is coming from createStateField, as processingOn is set to true)

            // hit processingObjectLiteral as part of the 'createStateField' traversal.
            this.processingStateVariableDeclaration.processingObjectLiteral = true;
            this.processingStateVariableDeclaration.processingOn = false;
        }*/
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
        /*if (this.processingStateVariableDeclaration.processingObjectLiteral) {
            this.processingStateVariableDeclaration.processingPropertyAssignment = true;
        }*/
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
        /*  if (this.processingStateVariableDeclaration.processingPropertyAssignment) {
            const actionFullName = node.expression.getFullText() + '.' + node.name.text;

            // Full node is passed into ActionSourceFile object to store the data about this node.
            (this.currentSelectorSourceFile as ActionSourceFile).addActionForStateVariable(actionFullName, node);
            this.processingStateVariableDeclaration.processingPropertyAssignment = false;
        }*/
        super.visitPropertyAccessExpression(node);
    }

    protected walkChildren(node: ts.Node): void {
        super.walkChildren(node);

        /* // After having finished walking the children of the node (i.e. processing the call Expressions), if we were
        // Processing the call expression, then reset the processingOn capability
        if (node.kind === ts.SyntaxKind.CallExpression) {
            if (this.processingStateVariableDeclaration.processingOn) {
                this.processingStateVariableDeclaration.reset();
            }
        }
        if (node.kind === ts.SyntaxKind.VariableDeclaration) {

            //If we were hitting the call expressions, reset those too
            this.processingStateVariableDeclaration.reset();
        }*/
    }

    private printSelectorElements(): void {
        this.selectorSourceFileCollection.forEach((value: SelectorsSourceFile, _key: string) => {
            value.print();
        });
    }
}
