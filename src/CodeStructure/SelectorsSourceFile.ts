import * as ts from 'typescript';

import { CreateSelectorElement } from './SelectorComponents/CreateSelectorElement';
import { StateSelectorElement } from './SelectorComponents/StateSelectorElement';

export class SelectorsSourceFile {
    // The source file.
    private readonly stateSourceFile: ts.SourceFile;

    private readonly createSelectorElements: CreateSelectorElement[] = [];

    private readonly stateSelectorElements: Map<string, StateSelectorElement> = new Map<string, StateSelectorElement>();

    private currentCreateSelectorElement: CreateSelectorElement | undefined;

    constructor(sourceFile: ts.SourceFile) {
        this.stateSourceFile = sourceFile;
    }

    public addCreateSelectorsNode(node: ts.VariableDeclaration, callExpression: ts.CallExpression) {
        this.currentCreateSelectorElement = new CreateSelectorElement(node, callExpression);
        this.createSelectorElements.push(this.currentCreateSelectorElement);

        this.locatePrecedentSelector();
    }

    // These represent state.getIn cases, that do not have createSelector in them.
    public addStateSelectorsNode(node: ts.VariableDeclaration) {
        this.stateSelectorElements.set(node.name.getFullText().trim(), new StateSelectorElement(node));
    }

    private locatePrecedentSelector() {
        if (this.currentCreateSelectorElement) {
            const callExpression = this.currentCreateSelectorElement.getCallExpression();

            // Get arguments for the call expression.
            const createSelectorArgs = callExpression.arguments;

            if (createSelectorArgs && createSelectorArgs.length > 1) {
                const firstArg = createSelectorArgs[0];
                if (firstArg.kind === ts.SyntaxKind.ArrayLiteralExpression) {
                    // tslint:disable-next-line: prefer-type-cast
                    const arrayElements = (firstArg as ts.ArrayLiteralExpression).elements;

                    // <ToDo> Currently, we are only supporting a single element.
                    if (arrayElements.length === 1) {
                        const firstArrayElement = arrayElements[0];
                        if (firstArrayElement.kind === ts.SyntaxKind.Identifier) {
                            const firstArgName = firstArrayElement.getFullText();

                            // if there is a state selector found for this type, tie it with this selector.
                            const stateSelector = this.stateSelectorElements.get(firstArgName);
                            if (stateSelector) {
                                this.currentCreateSelectorElement.setPrecedingSelector(stateSelector);
                            }
                        }
                    }
                }
            }
        }
    }

    public print() {
        console.log('<h1>Selectors in SourceFile: ' + this.stateSourceFile.fileName + '</h1>');

        if (this.createSelectorElements.length > 0) {
            console.log('<table>');

            console.log('<tr>');
            console.log('<td><b>Selectors</b></td>');
            console.log('<td><b>Initial Value</b></td>');
            console.log('<td><b>Actions</b></td>');

            console.log('<td><b>Tests</b></td>');

            this.createSelectorElements.forEach(createSelectorElement => {
                createSelectorElement.print();
            });
            console.log('<td><b>Tests</b></td>');

            this.stateSelectorElements.forEach(stateSelectorElement => {
                stateSelectorElement.print();
            });
            console.log('</table>');
        } else {
            console.log('<h3>No data found</h2>');
        }
    }
}
