import * as ts from 'typescript';

/*
Marked as possible, as we need to process it to identify
Action defintion:
type: connectorInfoActionTypes.UpdatePermissionsChoice,
payload: choice
};*/
export class PossibleActionDefinition {
    public enclosingVariableDeclaration: ts.VariableDeclaration;
    public enclosingObjectLiteralDefinition: ts.ObjectLiteralExpression;
    public typeDeclaration: ts.PropertyAssignment;
    public payloadDeclaration: ts.PropertyAssignment;

    public isEnclosingObjectLiteralActionDefinition(): boolean {
        // Object literal expression has 2 properties and each is a property assignment.
        const objectProperties = this.enclosingObjectLiteralDefinition.properties;
        if (objectProperties && objectProperties.length === 2) {
            if (
                objectProperties[0].kind === ts.SyntaxKind.PropertyAssignment &&
                objectProperties[1].kind === ts.SyntaxKind.PropertyAssignment
            ) {
                this.typeDeclaration = objectProperties[0];

                if (this.isPropertyAssignmentType()) {
                    this.payloadDeclaration = objectProperties[1];
                    return this.isPropertyAssignmentPayload();
                }
            }
        }

        return false;
    }

    private isPropertyAssignmentType() {
        return this.typeDeclaration.name.getText() === 'type';
    }

    private isPropertyAssignmentPayload() {
        return this.typeDeclaration.name.getText() === 'payload';
    }
}
