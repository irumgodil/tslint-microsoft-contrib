import * as ts from 'typescript';

// Whether the call expression is a CreateActionTypes
// tslint:disable-next-line: export-name
export function isCreateAction(callExpression: ts.CallExpression): boolean {
    // tslint:disable-next-line: prefer-type-cast
    if (callExpression.expression as ts.Identifier) {
        // tslint:disable-next-line: prefer-type-cast
        if ((callExpression.expression as ts.Identifier).text === 'createActionTypes') {
            return true;
        }
    }
}

// Assumes it is verified that this is a createActionType
export function getObjectLiteralPartOfActionType(callExpression: ts.CallExpression): ts.ObjectLiteralExpression {
    // tslint:disable-next-line: prefer-type-cast
    return callExpression.arguments[0] as ts.ObjectLiteralExpression;
}

// Assumes it is verified that this is a createActionType
export function addToObjectLiteralArray(objectliteralElement: ts.ObjectLiteralExpression, newObjectKey: string, newObjectValue: string) {
    const property = ts.createPropertyAssignment(newObjectKey, ts.createIdentifier(newObjectValue));
    const newEntries = objectliteralElement.properties.concat(property);
    return ts.createObjectLiteral(newEntries);
}
