import * as ts from 'typescript';

import { CreateSelectorSingleElement } from './SelectorComponents/CreateSelectorSingleElement';
import { CreateSelectorWithAppState } from './SelectorComponents/CreateSelectorWithAppState';

import { StateSelectorElement } from './SelectorComponents/StateSelectorElement';

export class SelectorsSourceFile {
    // The source file.
    private readonly stateSourceFile: ts.SourceFile;

    private readonly createSelectorWithAppStates: Map<string, CreateSelectorWithAppState> = new Map<string, CreateSelectorWithAppState>();

    private readonly createSelectorElements: CreateSelectorSingleElement[] = [];

    private readonly stateSelectorElements: Map<string, StateSelectorElement> = new Map<string, StateSelectorElement>();

    private currentCreateSelectorElement: CreateSelectorSingleElement | undefined;

    constructor(sourceFile: ts.SourceFile) {
        this.stateSourceFile = sourceFile;
    }

    public addCreateSelectorsWithAppStateNode(selector: CreateSelectorWithAppState) {
        this.createSelectorWithAppStates.set(selector.getName(), selector);
    }

    public addCreateSelectorsNode(node: ts.VariableDeclaration, createSelector: ts.CallExpression, getCall: ts.CallExpression) {
        this.currentCreateSelectorElement = new CreateSelectorSingleElement(node, createSelector, getCall);
        this.createSelectorElements.push(this.currentCreateSelectorElement);

        this.locatePrecedentSelector();
    }

    // These represent state.getIn cases, that do not have createSelector in them.
    public addStateSelectorsNode(node: ts.VariableDeclaration, callExpression: ts.CallExpression) {
        this.stateSelectorElements.set(node.name.getFullText().trim(), new StateSelectorElement(node, callExpression));
    }

    private locatePrecedentSelector() {
        if (this.currentCreateSelectorElement) {
            const callExpression = this.currentCreateSelectorElement.getCreateSelectorExpression();

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
                            // To-do: clean this code
                            const stateSelector = this.stateSelectorElements.get(firstArgName);
                            if (stateSelector) {
                                this.currentCreateSelectorElement.setPrecedingSelector(stateSelector);
                            } else {
                                const createAppStateSelector = this.createSelectorWithAppStates.get(firstArgName);
                                if (createAppStateSelector) {
                                    this.currentCreateSelectorElement.setPrecedingSelector(createAppStateSelector);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    public print() {
        if (this.createSelectorWithAppStates.size > 0) {
            console.log('<h1>Selectors in SourceFile: ' + this.stateSourceFile.fileName + '</h1>');

            console.log("<table class='selector'>");
            console.log('<tr />');
            console.log('<tr><b>CreateState Selectors With AppState</b></tr>');
            console.log('<tr>');
            console.log('<td><b>Selector name</b></td>');

            console.log('<td><b>App State Vars</b></td>');
            console.log('<td><b>Parameters</b></td>');

            console.log('</tr>');
            this.createSelectorWithAppStates.forEach(stateSelectorElement => {
                stateSelectorElement.print();
            });

            console.log('</table>');
        }

        if (this.stateSelectorElements.size > 0) {
            console.log('<h1>Selectors in SourceFile: ' + this.stateSourceFile.fileName + '</h1>');

            console.log("<table class='selector'>");
            console.log('<tr />');
            console.log('<tr><b>State Selectors</b></tr>');
            console.log('<tr>');
            console.log('<td><b>Selector name</b></td>');

            console.log('<td><b>App State Var</b></td>');
            console.log('<td><b>Parameters</b></td>');

            console.log('</tr>');
            this.stateSelectorElements.forEach(stateSelectorElement => {
                stateSelectorElement.print();
            });

            console.log('</table>');
        }
        if (this.createSelectorElements.length > 0) {
            console.log('<h1>Selectors in SourceFile: ' + this.stateSourceFile.fileName + '</h1>');

            console.log("<table class='selector'>");

            console.log('<tr><b>CreateSelectors</b></tr>');
            console.log('<tr>');
            console.log('<td><b>Selector name</b></td>');
            console.log('<td><b>Preceding Selector Name</b></td>');
            console.log('<td><b>Variable from Preceding selector</b></td>');

            console.log('</tr>');

            this.createSelectorElements.forEach(createSelectorElement => {
                createSelectorElement.print();
            });
            console.log('<tr />');
            console.log('</table>');
        }
    }
}
