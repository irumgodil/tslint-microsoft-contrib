import * as ts from 'typescript';
import { ASelectorElement } from './ASelectorElement';

// Example Statement:
/*
export const isWizardCompleteSelector = createSelector([wizardSelector], (wizard: AddConnectorStates) =>
  wizard!.get('wizardComplete')
)*/
export class CreateSelectorElement extends ASelectorElement {
    // This is the full variable declaration, see definition of 'selectedStepId' above
    private overallDeclaration: ts.VariableDeclaration;

    /* In this case, the preceding selector is ''wizardSelector'
    export const isWizardCompleteSelector = createSelector([wizardSelector], (wizard: AddConnectorStates) =>
    wizard!.get('wizardComplete')
    // TODO: As part of this code, for now we are only working on a single kind of preceding selector element.
    */
    private precedingSelectorElement: ASelectorElement;

    /**
     * The selector variable name.
     */
    private varName: string = '';

    private createSelectorCallExpression: ts.CallExpression;

    /***
     * Initialized value of this state variable
     * Logic:
     * > Pull out the initializer part of the Variable Declaration and checks its arguments.
     * > Takes the first argument of the initializer as the initialization value.
     */
    private initializedValue: string = '';

    constructor(createSelectorVar: ts.VariableDeclaration, createSelectorCallExpression: ts.CallExpression) {
        super();
        this.overallDeclaration = createSelectorVar;

        this.createSelectorCallExpression = createSelectorCallExpression;

        // Set the name of the state variable.
        this.setName();
    }

    public getCallExpression(): ts.CallExpression {
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
     * Gets the initializer Value of this State variable.
     *
     * Logic:
     * > Pull out the initializer part of the Variable Declaration and checks its arguments.
     * > Takes the first argument of the initializer as the initialization value.
     *
     * */
    public process(): void {
        // Uses the right hand side of the Variable declaration as the initializer.
        const initializer: ts.CallExpression = this.overallDeclaration.initializer as ts.CallExpression;

        if (initializer) {
            const args = initializer.arguments;

            const objectInitializer: ts.ObjectLiteralExpression = args[1] as ts.ObjectLiteralExpression;
            //  console.log("Initializer Type arguments: " + objectInitializer._leftHandSideExpressionBrand);
            if (args) {
                this.initializedValue = args[0].getFullText();
                args.forEach(arg => {
                    //       console.log("Initializer Type arguments222: " + arg);
                });
            }
        }
    }

    /**
     * This is the table that is printed in the main html for test cases.
     */
    public print(): void {
        console.log('<tr>');
        console.log('<td><b>' + this.varName + '</b></td>');
        console.log('<td>');

        if (this.precedingSelectorElement) {
            console.log('<td> PrecedingSelector: ');
            this.precedingSelectorElement.print();
            console.log('</td>');
        }
        //  this.printTests();
        console.log('</td></tr>');
    }
}
