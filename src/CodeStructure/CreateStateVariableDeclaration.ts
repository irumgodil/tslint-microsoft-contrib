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

    private actionPropertyExpressions: Map<string, ts.PropertyAccessExpression> = new Map();
    private varName: string = '';

    private initializedValue: string = '';

    constructor(createStateVar: ts.VariableDeclaration) {
        this.overallDeclaration = createStateVar;
        this.setName();
    }

    public addActionPropertyExpression(actionName: string, propertyAccessExpression: ts.PropertyAccessExpression) {
        this.actionPropertyExpressions.set(actionName, propertyAccessExpression);
    }

    private setName(): void {
        const identifierObject = this.overallDeclaration.name as ts.Identifier;

        if (identifierObject) {
            this.varName = identifierObject.escapedText.toString();
        }
    }

    public process(): void {
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
        console.log('<table>');

        const originalState = 'const originalState = ' + this.initializedValue + ';';
        const expectedState = 'const expectedState = {Fillout};';

        this.actionPropertyExpressions.forEach((_value: ts.PropertyAccessExpression, key: string) => {
            console.log('<tr className="testCase">');
            console.log('<td>');

            const testAction = 'const testAction = {' + 'type: ' + key + ',' + 'payload: expectedState};';

            const actualState = 'const actualState =  ' + this.varName + '(originalState, testAction);';
            const test = 'expect(actualState).toEqual(expectedState);';

            console.log('<div>');
            console.log(originalState);
            console.log('</div><div>');
            console.log(expectedState);
            console.log('</div><div>');
            console.log(testAction);
            console.log('</div><div>');
            console.log(actualState);
            console.log('</div><div>');
            console.log(test);
            console.log('</div>');

            console.log('</td>');
            console.log('</tr>');
        });
        console.log('</table>');
        console.log('</td>');
    }
}
