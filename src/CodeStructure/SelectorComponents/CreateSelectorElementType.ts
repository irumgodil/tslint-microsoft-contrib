import * as ts from 'typescript';
import { ASelectorElement } from './ASelectorElement';

// Example Statement:
/*
export const isWizardCompleteSelector = createSelector([wizardSelector], (wizard: AddConnectorStates) =>
  wizard!.get('wizardComplete')
)*/
export class CreateSelectorElementType extends ASelectorElement {
    // This is the full variable declaration, see definition of 'selectedStepId' above
    protected overallDeclaration: ts.Node;

    // This is the full call createSelector(args, args)
    protected createSelectorCallExpression: ts.CallExpression;

    constructor(createSelectorVar: ts.Node, createSelectorCallExpression: ts.CallExpression) {
        super();
        this.overallDeclaration = createSelectorVar;
        this.createSelectorCallExpression = createSelectorCallExpression;
    }

    public getCreateSelectorExpression(): ts.CallExpression {
        return this.createSelectorCallExpression;
    }

    /**
     * This is the table that is printed in the main html for test cases.
     */
    public print(): void {}

    /**
     * This is the table that is printed in the main html for test cases.
     */
    public printTests(): void {}

    public printAppState(varList: string[], isPrecedingSelector?: boolean): void {}

    // To-do: make this a separate sub-class.
    public addVarToStateList(arg: string): void {
        //console.log("nothing to add in CreateSelectorElementType");
    }

    // To-do: make this a separate sub-class.
    public removeVarFromStateList(arg: string): void {
        //console.log("nothing to remove in CreateSelectorElementType");
    }
}
