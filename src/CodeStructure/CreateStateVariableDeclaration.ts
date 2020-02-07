import * as ts from 'typescript';

// Example Statement:
/*
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

        console.log('</td></tr>');
    }
}
