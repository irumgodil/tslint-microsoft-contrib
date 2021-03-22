import * as ts from 'typescript';
import { ASelectorElement } from './ASelectorElement';

import { StateSelectorVarList } from './StateSelectorVarList';
import { AstUtils } from '../../utils/AstUtils';

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
    private varList: StateSelectorVarList = new StateSelectorVarList();

    constructor(createStateVar: ts.VariableDeclaration, callExpression: ts.CallExpression) {
        super();
        this.overallDeclaration = createStateVar;
        this.callExpression = callExpression;

        // Set the name of the state variable.
        this.setName();
        this.isPrivateSelector = AstUtils.isExported(createStateVar);
        this.process();
    }

    public addVarToStateList(arg: string): void {
        this.varList.addVar(arg);
    }

    public removeVarFromStateList(arg: string): void {
        this.varList.removeFromVarList(arg);
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

        this.varList.addVarList(this.callExpression.arguments);
    }

    /**
     * This is the table that is printed in the main html for test cases.
     */
    public print(): void {
        let className = '"publicSelector"';
        if (this.isPrivateSelector) {
            className = '"privateSelector"';
        }
        console.log('<tr class =' + className + '>');
        console.log('<td><b>' + this.varName + '</b></td>');

        console.log('<td><div>' + this.isAppStateBased + '</div>');
        console.log('<div> appStateVarName: ' + this.appStateVariableName + '</div></td>');

        console.log('<td>');
        this.printTests();

        console.log('</td>');

        console.log('</td></tr>');
    }

    public printTests(): void {
        const describeString = "describe('Selectors for " + this.varName + "', () => {";
        const itString = "it('Test retrieving values for " + this.varName + "', () => {";
        const endTag = '})';

        const expectedValue = 'const expectedValue = <FilloutExpectedValue>;';

        const expectedValueFill = 'expectedValue';
        const result = 'const result = ' + this.varName + '(appState)';
        const expectedStmt = 'expect(result).toEqual(' + expectedValueFill + ')';

        console.log('<div class="describe">');
        console.log(describeString);
        console.log('</div><div class="itString">');
        console.log(itString);
        console.log('</div>');

        console.log('</div><div class="indentLine">');
        console.log(expectedValue);
        console.log('</div>');

        this.printAppState([]);

        console.log('<div class="indentLine">');
        console.log(result);
        console.log('</div><div class="indentLine">');
        console.log(expectedStmt);
        console.log('</div><div class="itString">');

        console.log(endTag);
        console.log('</div><div class="describe">');
        console.log(endTag);
        console.log('</div>');
    }

    public printAppState(precedingVarList: string[]): void {
        const endTag = '});';
        const appState = 'const appState = fromJS({';

        console.log('<div class="indentLine">');
        console.log(appState);
        console.log('</div>');

        this.varList.printTests(precedingVarList);

        console.log('<div>');
        console.log(endTag);
        console.log('</div>');
    }
}
