import * as ts from 'typescript';
import { StateSelectorVarList } from './StateSelectorVarList';
import { CreateSelectorElementType } from './CreateSelectorElementType';
import { AstUtils } from '../../utils/AstUtils';

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
    public stateselectorVarList: StateSelectorVarList = new StateSelectorVarList();

    // This is the string value being set, so in wizard!.get('wizardComplete'), it is 'wizardComplete'
    private valueString: string = '';

    constructor(
        createSelectorVar: ts.VariableDeclaration,
        createSelectorCallExpression: ts.CallExpression,
        varArgs: ts.NodeArray<ts.Expression>
    ) {
        super(createSelectorVar, createSelectorCallExpression);
        this.isPrivateSelector = AstUtils.isExported(createSelectorVar);

        // Set the name of the state variable.
        this.setName();

        this.stateselectorVarList.addVarList(varArgs);
        this.tryDeduceValueString();
    }

    public addVarToStateList(arg: string): void {
        this.stateselectorVarList.addVar(arg);
    }

    public removeVarFromStateList(arg: string): void {
        this.stateselectorVarList.removeFromVarList(arg);
    }

    public getCreateSelectorExpression(): ts.CallExpression {
        return this.createSelectorCallExpression;
    }

    /*const isIdentitySupported = createSelector(
  (state: AppState) => state.getIn(['app', 'brsSetting']),
  (brsSettings: IImmutableMap<BRSSetting>) => brsSettings.get('MicrosoftSearchEnableIdentityMapping')
)*/
    private tryDeduceValueString(): void {
        if (this.createSelectorCallExpression.arguments.length === 2) {
            const secondArg = this.createSelectorCallExpression.arguments[1];
            if (secondArg.kind === ts.SyntaxKind.ArrowFunction) {
                const arrowFunction = secondArg as ts.ArrowFunction;
                if (arrowFunction.body.kind === ts.SyntaxKind.CallExpression) {
                    const callExp = arrowFunction.body as ts.CallExpression;
                    if (callExp.expression.getText().endsWith('.get')) {
                        this.valueString = callExp.arguments[0].getFullText();
                    }
                }
            }
        }
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
        let className = '"publicSelector"';
        if (this.isPrivateSelector) {
            className = '"privateSelector"';
        }
        console.log('<tr class =' + className + '>');
        console.log('<td class="describe"><b>' + this.varName + '</b></td>');
        console.log('<td>');
        this.stateselectorVarList.print();
        console.log('</td>');
        console.log('<td>');

        this.printTests();

        console.log('</td>');
        console.log('</tr>');
    }

    public printTests(): void {
        const describeString = "describe('Selectors for " + this.varName + "', () => {";
        const itString = "it('Test retrieving values for " + this.varName + "', () => {";
        const endTag = '})';

        const result = 'const result = ' + this.varName + '(appState)';
        const expectedStmt = 'expect(result).toEqual(expectedResult)';
        const expectedStmtDecl = 'const expectedResult = createImmutableMap({} as);';

        console.log('<div class="describe">');

        console.log(describeString);
        console.log('</div><div class="itString">');

        console.log(itString);
        console.log('</div>');
        console.log('<div class="indentLine">');
        console.log(expectedStmtDecl);
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

    public printAppState(precedingVarList: string[], isPrecedingSelector?: boolean): void {
        const endTag = '});';
        const appState = 'const appState = fromJS({';
        console.log('</div><div class="indentLine">');
        console.log(appState);
        console.log('</div>');

        // If this is a precedeing selector, then its own value is not the last one to be printed. The last child is technically the last argument.
        this.stateselectorVarList.printTests(precedingVarList, this.valueString, isPrecedingSelector);

        console.log('</div><div class="indentLine">');

        console.log(endTag);
        console.log('</div>');
    }
}
