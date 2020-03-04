import * as ts from 'typescript';
import { ASelectorElement } from './ASelectorElement';

import { CreateSelectorElementType } from './CreateSelectorElementType';

// Example Statement:
/*
export const isWizardCompleteSelector = createSelector([wizardSelector], (wizard: AddConnectorStates) =>
  wizard!.get('wizardComplete')
)*/
export class CreateSelectorSingleElement extends CreateSelectorElementType {
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
        console.log('<tr>');
        console.log('<td><b>' + this.varName + '</b></td>');

        if (this.precedingSelectorElement) {
            console.log('<td>' + this.precedingSelectorElement.getName());
            console.log('</td>');
        }

        // To-do: only works for a single arg, but what about other cases?
        if (this.getCall && this.getCall.arguments && this.getCall.arguments.length === 1) {
            console.log('<td>' + this.getCall.arguments[0].getFullText());

            console.log('</td>');
        }

        this.printTests();
        console.log('</tr>');
    }

    public printTests(): void {
        console.log('<td>');

        const describeString = "describe('Selectors for " + this.varName + "', () => {";
        const itString = "it('Test retrieving values for " + this.varName + "', () => {";

        const endTag = '})';

        const expectedValueFill = 'FilloutExpectedValue';
        const result = 'const result = ' + this.varName + '(appState)';
        const expectedStmt = 'expect(result).toEqual(' + expectedValueFill + ')';

        console.log('<div>');

        console.log(describeString);
        console.log('</div><div>');

        console.log(itString);
        console.log('</div>');

        // To-do: only works for a single arg, but what about other cases?
        if (this.getCall && this.getCall.arguments && this.getCall.arguments.length === 1) {
            this.precedingSelectorElement.addVarToStateList(this.getCall.arguments[0].getFullText());
        }

        this.precedingSelectorElement.printAppState();

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
