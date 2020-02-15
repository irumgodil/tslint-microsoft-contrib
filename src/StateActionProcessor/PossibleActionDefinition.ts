import * as ts from 'typescript';

/*
Marked as possible, as we need to process it to identify
Action defintion.

Example:
export const OpenConnectorDetailPanelAction = (detailsData: IDetailsPanelConnectorData) => {
  return {
    type: connectorDetailPanelActionTypes.OpenConnectorDetailPanel,
    payload: detailsData
  }
}
};*/
export class PossibleActionDefinition {
    // The enclosing variable declaration - in the above example it is 'OpenConnectorDetailPanelAction'
    // TODO: This field is currently not being used anywhere in the code.
    public enclosingVariableDeclaration: ts.VariableDeclaration | undefined;

    // The actual Object Literal here, that is processed:
    //{
    //type: connectorDetailPanelActionTypes.OpenConnectorDetailPanel,
    //payload: detailsData
    //}
    public enclosingObjectLiteralDefinition: ts.ObjectLiteralExpression | undefined;

    // The type and payload declarations.
    public typeDeclaration: ts.PropertyAssignment | undefined;
    public payloadDeclaration: ts.PropertyAssignment | undefined;

    /**
     * Since this is a potential action definition, this method checks if it is really an action definition.
     *
     * Logic:
     * - The hypothesis to check for an action definition is to see if the ObjectLiteral has 2
     *   properties, that are both PropertyAssignments and those properties are 'type' and 'payload' values
     *
     */
    public isEnclosingObjectLiteralActionDefinition(): boolean {
        // Object literal expression has 2 properties and each is a property assignment.
        const objectProperties = this.enclosingObjectLiteralDefinition!.properties;
        if (objectProperties && objectProperties.length === 2) {
            if (
                objectProperties[0].kind === ts.SyntaxKind.PropertyAssignment &&
                objectProperties[1].kind === ts.SyntaxKind.PropertyAssignment
            ) {
                const isTypeAndPayloadDefinition =
                    this.isPropertyAssignmentType(objectProperties[0] as ts.PropertyAssignment) &&
                    this.isPropertyAssignmentPayload(objectProperties[1] as ts.PropertyAssignment);

                if (isTypeAndPayloadDefinition) {
                    this.typeDeclaration = objectProperties[0] as ts.PropertyAssignment;
                    this.payloadDeclaration = objectProperties[1] as ts.PropertyAssignment;
                } else {
                    this.typeDeclaration = undefined;
                    this.payloadDeclaration = undefined;
                }
            }
        }

        return false;
    }

    // Checks if the property being assigned is 'type' as that is part of the enclosing definition.
    private isPropertyAssignmentType(typeProperty: ts.PropertyAssignment) {
        return typeProperty.name.getText() === 'type';
    }

    // Checks if the property being assigned is 'payload' as that is part of the enclosing definition.
    private isPropertyAssignmentPayload(payloadProperty: ts.PropertyAssignment) {
        return payloadProperty.name.getText() === 'payload';
    }
}
