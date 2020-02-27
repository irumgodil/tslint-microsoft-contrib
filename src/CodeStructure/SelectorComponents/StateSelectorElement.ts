import * as ts from 'typescript';
import { ASelectorElement } from './ASelectorElement';

export class StateSelectorElement extends ASelectorElement {
    // This is the full variable declaration, see definition of 'selectedStepId' above
    private overallDeclaration: ts.VariableDeclaration;

    // The call expression for this case: state.getIn(...)
    private callExpression: ts.CallExpression;

    // This is true, if the enclosing parameter is app-state level.
    private isAppStateBased: boolean = false;

    private appStateVariableName: string = '';

    // the list of values being modified as a result of this state variable. e.g. in case of:
    // return state.getIn(['microsoftSearch', 'connectorList', 'isAddConnectorWizardOpened']), it is the 3 strings
    // 'microsoftSearch', 'connectorList', 'isAddConnectorWizardOpened' in this order only.
    private varList: string[] = [];

    constructor(createStateVar: ts.VariableDeclaration, callExpression: ts.CallExpression) {
        super();
        this.overallDeclaration = createStateVar;
        this.callExpression = callExpression;

        // Set the name of the state variable.
        this.setName();
        this.process();
    }

    /**
     * Sets the state variable name.
     */
    private setName(): void {
        // The variable declaration that is being set is used as the Identifier
        const identifierObject = this.overallDeclaration.name as ts.Identifier;

        if (identifierObject) {
            this.varName = identifierObject.escapedText.toString();
        }
    }

    /**
     * Gets the initializer Value of this State variable.
     *
     * Logic:
     * > Pull out the initializer part of the Variable Declaration and checks its arguments.
     * > Takes the first argument of the initializer as the initialization value.
     *
     * */
    public process(): void {
        // The first thing to check if this is an AppState based selector. Example of AppState base is the following:
        // export const isAddConnectorWizardOpenedSelector = (state: AppState) => {

        if (this.overallDeclaration.initializer && this.overallDeclaration.initializer.kind === ts.SyntaxKind.ArrowFunction) {
            const initializer: ts.ArrowFunction = this.overallDeclaration.initializer as ts.ArrowFunction;

            if (initializer.parameters && initializer.parameters.length === 1) {
                const parameter = initializer.parameters[0];
                if (
                    parameter.type &&
                    parameter.type
                        .getFullText()
                        .trim()
                        .toLocaleLowerCase()
                        .indexOf('appstate') !== -1
                ) {
                    this.isAppStateBased = true;
                    this.appStateVariableName = parameter.name.getFullText();
                }
            }
        }

        // Populate the call expression arguments.
        this.callExpression.arguments.forEach((node: ts.Expression) => {
            // To-do: What happens if expression is not an array literal.
            if (ts.isArrayLiteralExpression(node)) {
                (node as ts.ArrayLiteralExpression).forEachChild((child: ts.Node) => {
                    // To-do: What happens if expression is not a string.
                    this.varList.push(child.getFullText());
                });
            }
        });
    }

    /**
     * This is the table that is printed in the main html for test cases.
     */
    public print(): void {
        console.log('<tr>');
        console.log('<td><b>' + this.varName + '</b></td>');
        console.log('<td>');

        console.log('<td><b>' + this.isAppStateBased + ' appStateVarName: ' + this.appStateVariableName + '</b></td>');

        console.log('<td>');

        this.varList.forEach((node: string) => {
            console.log(node + ': {');
        });

        console.log('</td></tr>');
    }
}
