import * as ts from 'typescript';

import { CreateSelectorSinglePrecedent } from './SelectorComponents/CreateSelectorSinglePrecedent';
import { CreateSelectorWithAppState } from './SelectorComponents/CreateSelectorWithAppState';

import { StateSelectorElement } from './SelectorComponents/StateSelectorElement';

export class SelectorsSourceFile {
    // The source file.
    private readonly stateSourceFile: ts.SourceFile;

    private readonly createSelectorWithAppStates: Map<string, CreateSelectorWithAppState> = new Map<string, CreateSelectorWithAppState>();
    private readonly createSelectorWithPrecedents: Map<string, CreateSelectorSinglePrecedent> = new Map<
        string,
        CreateSelectorSinglePrecedent
    >();
    private readonly stateSelectorElements: Map<string, StateSelectorElement> = new Map<string, StateSelectorElement>();

    private currentCreateSelectorElement: CreateSelectorSinglePrecedent | undefined;

    constructor(sourceFile: ts.SourceFile) {
        this.stateSourceFile = sourceFile;
    }

    public addCreateSelectorsWithAppStateNode(selector: CreateSelectorWithAppState) {
        this.createSelectorWithAppStates.set(selector.getName(), selector);
    }

    public addCreateSelectorsNode(node: ts.VariableDeclaration, createSelector: ts.CallExpression, getCall: ts.CallExpression) {
        this.currentCreateSelectorElement = new CreateSelectorSinglePrecedent(node, createSelector, getCall);
        this.createSelectorWithPrecedents.set(this.currentCreateSelectorElement.getName(), this.currentCreateSelectorElement);
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
                                } else {
                                    const precedingSelector = this.createSelectorWithPrecedents.get(firstArgName);
                                    if (precedingSelector) {
                                        this.currentCreateSelectorElement.setPrecedingSelector(precedingSelector);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    public print() {
        const fileId = this.stateSourceFile.fileName.replace(/(\/|\.|\:|\-)/g, '_');
        const hasSelectors =
            this.createSelectorWithAppStates.size > 0 || this.stateSelectorElements.size > 0 || this.createSelectorWithPrecedents.size > 0;

        if (hasSelectors) {
            console.log('<br/>');
            console.log('<h4>Selectors in SourceFile: ' + this.stateSourceFile.fileName + '</h4>');
        } else {
            //console.log('<div> Selectors in SourceFile: ' + this.stateSourceFile.fileName + ' - None</div>');
        }

        // Eg: const isIdentitySupported = createSelector(
        /* (state: AppState) => state.getIn(['app', 'brsSetting']),
            (brsSettings: IImmutableMap<BRSSetting>) => brsSettings.get('MicrosoftSearchEnableIdentityMapping')
            )*/
        if (this.createSelectorWithAppStates.size > 0) {
            console.log(
                '<div><a href="#createState' +
                    fileId +
                    '" data-toggle="collapse">CreateSelectors With AppState (as arg): ' +
                    this.stateSourceFile.fileName +
                    '</a></div>'
            );
            console.log("<table id='createState" + fileId + "'  class='collapse selector'>");
            console.log('<tr>');
            console.log('<td><b>Selector name</b></td>');
            console.log('<td><b>App State Vars</b></td>');
            console.log('<td><b>Tests</b></td>');
            console.log('</tr>');
            this.createSelectorWithAppStates.forEach(stateSelectorElement => {
                stateSelectorElement.print();
            });

            console.log('</table>');
        }

        // eg.
        /*export const udtStatesSelector = (state: AppState) => {
            return state.getIn(['microsoftSearch', 'udtStates'])
        }*/
        if (this.stateSelectorElements.size > 0) {
            console.log(
                '<div><a href="#stateSelector' +
                    fileId +
                    '" data-toggle="collapse">State Selectors: ' +
                    this.stateSourceFile.fileName +
                    '</a></div>'
            );

            console.log("<table id='stateSelector" + fileId + "'  class='collapse selector'>");
            console.log('<tr>');
            console.log('<td><b>Selector name</b></td>');
            console.log('<td><b>App State Var</b></td>');
            console.log('<td><b>Tests</b></td>');
            console.log('</tr>');
            this.stateSelectorElements.forEach(stateSelectorElement => {
                stateSelectorElement.print();
            });
            console.log('</table>');
        }
        if (this.createSelectorWithPrecedents.size > 0) {
            console.log(
                '<div><a href="#create' +
                    fileId +
                    '" data-toggle="collapse">CreateSelectors  with Precedent: ' +
                    this.stateSourceFile.fileName +
                    '</a></div>'
            );
            console.log("<table id='create" + fileId + "'  class='collapse selector'>");

            console.log('<tr><b></b></tr>');
            console.log('<tr>');
            console.log('<td><b>Selector name</b></td>');
            console.log('<td><b>Preceding Selector Name</b></td>');
            console.log('<td><b>Variable from Preceding selector</b></td>');
            console.log('<td><b>Tests</b></td>');
            console.log('</tr>');

            this.createSelectorWithPrecedents.forEach(createSelectorElement => {
                createSelectorElement.print();
            });
            console.log('<tr />');
            console.log('</table>');
        }
    }
}
