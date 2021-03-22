import * as ts from 'typescript';
import { ASelectorElement } from './ASelectorElement';

import { CreateSelectorElementType } from './CreateSelectorElementType';
import { SyntaxKind } from 'typescript';
import { AstUtils } from '../../utils/AstUtils';

// Example Statement:
/*
export const isWizardCompleteSelector = createSelector([wizardSelector], (wizard: AddConnectorStates) =>
  wizard!.get('wizardComplete')
)*/
export class CreateSelectorSinglePrecedent extends CreateSelectorElementType {
    /* In this case, the preceding selector is ''wizardSelector'
    export const isWizardCompleteSelector = createSelector([wizardSelector], (wizard: AddConnectorStates) =>
    wizard!.get('wizardComplete')
    // TODO: As part of this code, for now we are only working on a single kind of preceding selector element.
    */
    private precedingSelectorElement: ASelectorElement;

    // This is the string value being set, so in wizard!.get('wizardComplete'), it is 'wizardComplete'
    private readonly valueString: string = '';

    private getCall: ts.CallExpression;

    constructor(createSelectorVar: ts.VariableDeclaration, createSelectorCallExpression: ts.CallExpression, getCall: ts.CallExpression) {
        super(createSelectorVar, createSelectorCallExpression);
        this.getCall = getCall;

        // Set the name of the state variable.
        this.setName();
        this.isPrivateSelector = AstUtils.isExported(createSelectorVar);
    }

    public getCreateSelectorExpression(): ts.CallExpression {
        return this.createSelectorCallExpression;
    }

    public setPrecedingSelector(precedingSelector: ASelectorElement): void {
        this.precedingSelectorElement = precedingSelector;
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
        console.log('<td><b>' + this.varName + '</b></td>');

        console.log('<td>');
        if (this.precedingSelectorElement) {
            console.log(this.precedingSelectorElement.getName());
        }
        console.log('</td>');
        console.log('<td>');

        // To-do: only works for a single arg, but what about other cases?
        if (this.getCall && this.getCall.arguments && this.getCall.arguments.length === 1) {
            console.log(this.getCall.arguments[0].getFullText());
        }

        console.log('</td>');
        console.log('<td>');
        this.printTests();

        console.log('</td>');
        console.log('</tr>');
    }

    // In this case we print the app state of the preceding selector.
    public printAppState(varList: string[]): void {
        if (this.precedingSelectorElement && this.getCall && this.getCall.arguments && this.getCall.arguments.length === 1) {
            // preceding is type of Precedence
            const isPrecedentTypeofPrecedent = this.precedingSelectorElement instanceof CreateSelectorSinglePrecedent;

            const arg = this.getCall.arguments[0].getFullText();
            if (!isPrecedentTypeofPrecedent) {
                this.precedingSelectorElement.addVarToStateList(arg);
            } else {
                varList.unshift(arg);
            }
            this.precedingSelectorElement.printAppState(varList, true);

            if (!isPrecedentTypeofPrecedent) {
                this.precedingSelectorElement.removeVarFromStateList(arg);
            }
        }
    }

    public printTests(): void {
        if (this.precedingSelectorElement && this.getCall && this.getCall.arguments && this.getCall.arguments.length === 1) {
            const describeString = "describe('Selectors for " + this.varName + "', () => {";
            const itString = "it('Test retrieving values for " + this.varName + "', () => {";

            const endTag = '})';

            const expectedStmtDecl = 'const expectedResult = createImmutableMap({} as);';

            const expectedValueFill = 'expectedResult';
            const result = 'const result = ' + this.varName + '(appState)';
            const expectedStmt = 'expect(result).toEqual(' + expectedValueFill + ')';

            console.log('<div class="describe">');
            console.log(describeString);
            console.log('</div><div class="itString">');
            console.log(itString);
            console.log('</div>');
            console.log('<div class="indentLine">');
            console.log(expectedStmtDecl);
            console.log('</div>');

            // To-do: only works for a single arg, but what about other cases?
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
    }
}
