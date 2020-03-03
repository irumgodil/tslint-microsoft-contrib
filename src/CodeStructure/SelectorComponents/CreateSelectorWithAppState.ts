import * as ts from 'typescript';
import { StateSelectorVarList } from './StateSelectorVarList';
import { CreateSelectorElementType } from './CreateSelectorElementType';

// Example Statement:
/*
export const ActionToConfirmSelector = createSelector(
  (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'actionToConfirm']),
  (action: DatasetActions) => action
)
*/
export class CreateSelectorWithAppState extends CreateSelectorElementType {
    /* In this case, the varlist is ''wizardSelector'
    export const ActionToConfirmSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'actionToConfirm']),
    (action: DatasetActions) => action
    )
    // TODO: As part of this code, for now we are only working on a single kind of varlist.
    */
    private stateselectorVarList: StateSelectorVarList = new StateSelectorVarList();

    // This is the string value being set, so in wizard!.get('wizardComplete'), it is 'wizardComplete'
    private readonly valueString: string = '';

    constructor(
        createSelectorVar: ts.VariableDeclaration,
        createSelectorCallExpression: ts.CallExpression,
        varArgs: ts.NodeArray<ts.Expression>
    ) {
        super(createSelectorVar, createSelectorCallExpression);

        // Set the name of the state variable.
        this.setName();
        this.stateselectorVarList.addVarList(varArgs);
    }

    public getCreateSelectorExpression(): ts.CallExpression {
        return this.createSelectorCallExpression;
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
     * This is the table that is printed in the main html for test cases.
     */
    public print(): void {
        console.log('<tr>');
        console.log('<td><b>' + this.varName + '</b></td>');
        console.log('<td>');
        this.stateselectorVarList.print();
        console.log('</td>');

        this.printTests();

        console.log('</tr>');
    }

    private printTests(): void {
        console.log('<td>');

        const describeString = "describe('Selectors for " + this.varName + "', () => {";
        const itString = "it('Test retrieving values for " + this.varName + "', () => {";

        const endTag = '})';

        // const expectedValue = 'const expectedValue = FilloutExpectedValue;';

        const expectedValueFill = 'FilloutExpectedValue';
        const result = 'const result = ' + this.varName + '(appState)';
        const expectedStmt = 'expect(result).toEqual(' + expectedValueFill + ')';

        const appState = 'const appState = fromJS({';
        console.log('<div>');

        console.log(describeString);
        console.log('</div><div>');

        console.log(itString);
        console.log('</div><div>');

        console.log(appState);
        console.log('</div>');

        this.stateselectorVarList.printTests();

        console.log('})');
        console.log('<div>');
        console.log(result);
        console.log('</div><div>');
        console.log(expectedStmt);
        console.log('</div><div>');

        console.log(endTag);
        console.log('</div><div>');
        console.log(endTag);
        console.log('</div>');

        console.log('</td>');
    }
}
