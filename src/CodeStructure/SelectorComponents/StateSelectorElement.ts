import * as ts from 'typescript';
import { ASelectorElement } from './ASelectorElement';
import { debug } from 'util';

export class StateSelectorElement extends ASelectorElement {
    // This is the full variable declaration, see definition of 'selectedStepId' above
    private overallDeclaration: ts.VariableDeclaration;

    // This is true, if the enclosing parameter is app-state level.
    private isAppStateBased: boolean;

    private appStateVariableName: string;

    /**
     * The State variable name.
     */
    private varName: string = '';

    /***
     * Initialized value of this state variable
     * Logic:
     * > Pull out the initializer part of the Variable Declaration and checks its arguments.
     * > Takes the first argument of the initializer as the initialization value.
     */
    private initializedValue: string = '';

    constructor(createStateVar: ts.VariableDeclaration) {
        super();
        this.overallDeclaration = createStateVar;

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

        // Uses the right hand side of the Variable declaration as the initializer.
        /* const initializer: ts.CallExpression = this.overallDeclaration.initializer as ts.CallExpression;

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
        }*/
    }

    /**
     * This is the table that is printed in the main html for test cases.
     */
    public print(): void {
        console.log('<tr>');
        console.log('<td><b>' + this.varName + '</b></td>');
        console.log('<td>');

        console.log('<td><b>isAppStateBased: ' + this.isAppStateBased + ' appStateVarName: ' + this.appStateVariableName + '</b></td>');

        //  this.printTests();
        console.log('</td></tr>');
    }
}
