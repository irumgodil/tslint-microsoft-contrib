import * as ts from 'typescript';
import { PossibleActionDefinition } from '../StateActionProcessor/PossibleActionDefinition';
import { type } from 'os';

// IRUMTODO: why is this not StateActionComponentCollection
export class ActionDefinition extends PossibleActionDefinition {
    constructor(
        actionVariableDeclaration: ts.VariableDeclaration | undefined,
        objectDefinition: ts.ObjectLiteralExpression | undefined,
        typeDecl: ts.PropertyAssignment | undefined,
        payloadDecl: ts.PropertyAssignment | undefined
    ) {
        super();
        this.enclosingVariableDeclaration = actionVariableDeclaration;
        this.enclosingObjectLiteralDefinition = objectDefinition;
        this.typeDeclaration = typeDecl;
        this.payloadDeclaration = payloadDecl;
    }

    public getName(): string {
        return this.enclosingVariableDeclaration!.name.getText();
    }

    // The "type: ConnectorActionTypes.OpenConnector" value of the action.
    public getActionType(): string {
        // IRUMTODO: Will this always work.
        const isPropertyExpression =
            this.typeDeclaration &&
            this.typeDeclaration.initializer &&
            this.typeDeclaration.initializer.kind === ts.SyntaxKind.PropertyAccessExpression;
        if (isPropertyExpression) {
            const expression = this.typeDeclaration!.initializer as ts.PropertyAccessExpression;

            if (expression.expression && expression.name) {
                return (expression.expression as ts.Identifier).escapedText + '.' + (expression.name as ts.Identifier).escapedText;
            }
        }
        return 'name: ' + this.getName();
    }

    /**
      * Ex: connectorObj is the parameter.
    export const setActiveConnectorAction = (connectorObj: IImmutableMap<DatasetSummary>) => {
        return {
            type: connectorsListActionTypes.SetActiveConnector,
            payload: connectorObj
        };
    }; */
    public getParametersForAction(): string {
        let result = '';
        const initializer = this.enclosingVariableDeclaration!.initializer;

        if (initializer && initializer.kind === ts.SyntaxKind.ArrowFunction) {
            const args = (initializer as ts.ArrowFunction).parameters;
            if (args) {
                if (args.length === 1) {
                    result += 'expectedState';
                } else {
                    args.forEach((value: ts.ParameterDeclaration, index: number) => {
                        if (index !== 0) {
                            result += ',';
                        }
                        // IRUMTODO: is type undefined.
                        result += value.name.getText() + ':' + value.type!.getText();
                    });
                }
            }
        }

        return result;
    }

    public getActionDataForTest(): string {
        return this.getName() + '(' + this.getParametersForAction() + ');';
    }
}
