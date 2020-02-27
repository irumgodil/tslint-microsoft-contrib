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
        //  if (sourceFileName.indexOf('C:/m365/modules/host-mac/microsoft-search/connectors') !== -1) {
        if (true) {
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

        this.processingSelectorDeclarationStatus.reset();
    }

    /***
     * Call Expressions are calls to methods, so in case of call expressions that start with 'createStateField', we know there is a state variable in process
     */
    protected visitCallExpression(node: ts.CallExpression): void {
        if (this.processingSelectorDeclarationStatus.currentVariableBeingProcessed) {
            // If the call is to 'createSelector', parse out the variable declaration
            if (node.expression.getText() === 'createSelector') {
                if (this.currentSelectorSourceFile) {
                    // To-do - where else to set this to false.
                    this.processingSelectorDeclarationStatus.processingCreateSelectorOn = true;
                    this.processingSelectorDeclarationStatus.createSelectorExpression = node;
                }
            } else if (node.expression.getText() === 'state.getIn' && node.parent.kind === ts.SyntaxKind.ReturnStatement) {
                // We only parse this if this is a return statement, as other usages of this call could occcur at other points in the code.

                if (this.currentSelectorSourceFile) {
                    // This is the full Variable Declaration for the createSelector call
                    this.currentSelectorSourceFile.addStateSelectorsNode(
                        this.processingSelectorDeclarationStatus.currentVariableBeingProcessed as ts.VariableDeclaration,
                        node
                    );
                }
            } else if (node.expression.getText().indexOf('get') !== -1) {
                // We only parse this if this is a return statement, as other usages of this call could occcur at other points in the code.
                if (this.processingSelectorDeclarationStatus.processingCreateSelectorOn && this.currentSelectorSourceFile) {
                    // This is the full Variable Declaration for the createSelector call
                    this.currentSelectorSourceFile.addCreateSelectorsNode(
                        this.processingSelectorDeclarationStatus.currentVariableBeingProcessed as ts.VariableDeclaration,
                        this.processingSelectorDeclarationStatus.createSelectorExpression as ts.CallExpression,
                        node
                    );
                }

                this.processingSelectorDeclarationStatus.processingCreateSelectorOn = false;
            }
        }
        super.visitCallExpression(node);
    }

    protected walkChildren(node: ts.Node): void {
        super.walkChildren(node);
    }

    private printSelectorElements(): void {
        this.selectorSourceFileCollection.forEach((value: SelectorsSourceFile, _key: string) => {
            value.print();
        });
    }
}
