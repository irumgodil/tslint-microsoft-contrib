import * as ts from 'typescript';

// Example Statement:
/*e
const selectedStepId = createStateField('0', {
    [addConnectorWizardActionTypes.SetSelectedStep]: (
      _: string,
      action: ReturnType<typeof actions.setSelectedStepAction>
    ) => {
      return action.payload;
    }
  });*/
export class CreateStateVariableDeclaration {
    // This is the full variable declaration, see definition of 'selectedStepId' above
    private overallDeclaration: ts.VariableDeclaration;

    // The Map of all the Actions that we are processing:
    /*[addConnectorWizardActionTypes.SetSelectedStep]: (
        _: string,
        action: ReturnType<typeof actions.setSelectedStepAction>
      ) => {
        return action.payload;
      }*/
    private actionPropertyExpressions: Map<string, ts.PropertyAccessExpression> = new Map();

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
        this.overallDeclaration = createStateVar;

        // Set the name of the state variable.
        this.setName();
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

    public addActionPropertyExpression(actionName: string, propertyAccessExpression: ts.PropertyAccessExpression) {
        this.actionPropertyExpressions.set(actionName, propertyAccessExpression);
    }

    /**
     * This is the table that is printed in the main html for test cases.
     */
    public print(): void {
        console.log('<tr>');
        console.log('<td><b>' + this.varName + '</b></td>');
        console.log('<td><b>' + this.initializedValue + '</b></td>');
        console.log('<td>');

        this.actionPropertyExpressions.forEach((_value: ts.PropertyAccessExpression, key: string) => {
            console.log('<div>' + key + '</div>');
        });

        this.printTests();

        console.log('</td></tr>');
    }

    // IRUMTODO: Refactor to its own class

    public printTests(): void {
        console.log('<td>');
        const originalState = 'const originalState = ' + this.initializedValue + ';';
        const expectedState = 'const expectedState = {Fillout};';

        this.actionPropertyExpressions.forEach((_value: ts.PropertyAccessExpression, key: string) => {
            const describeString = "describe('reducers for " + this.varName + ' using action: ' + key + "', () => {";
            const itString = "it('should set the value for " + this.varName + ' using action: ' + key + "', () => {";

            const endTag = '});';
            const testAction = 'const testAction = {' + 'type: ' + key + ',' + 'payload: expectedState};';

            const actualState = 'const actualState =  ' + this.varName + '(originalState, testAction);';
            const test = 'expect(actualState).toEqual(expectedState);';

            console.log("<div class='indent'>");

            console.log(describeString);
            console.log("</div><div class='indent'>");

            console.log(itString);
            console.log("</div><div class='indent'>");
            console.log(originalState);
            console.log("</div><div class='indent'>");

            console.log(expectedState);
            console.log("</div><div class='indent'>");
            console.log(testAction);
            console.log("</div><div class='indent'>");
            console.log(actualState);
            console.log("</div><div class='indent'>");

            console.log(test);
            console.log("</div><div class='indent'>");

            console.log(endTag);
            console.log("</div><div class='indent'>");

            console.log(endTag);
            console.log('</div>');
        });

        console.log('</td>');
    }
}
