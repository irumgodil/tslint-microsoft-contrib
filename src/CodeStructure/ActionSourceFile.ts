import * as ts from 'typescript';
import { IdentifierActionObjectCollection } from './ActionComponents/IdentifierActionObjectCollection';
import { CreateStateVariableDeclaration } from './CreateStateVariableDeclaration';

import { VariableDeclaration } from './ActionComponents/VariableDeclaration';
import { ActionDefinition } from './ActionDefinition';

export class ActionSourceFile {
    private stateSourceFile: ts.SourceFile;

    private createStateIdentifiers: IdentifierActionObjectCollection = new IdentifierActionObjectCollection();

    private createActionTypes: VariableDeclaration = new VariableDeclaration();

    private actionStateVariables: CreateStateVariableDeclaration[] = [];
    private currentActionStateVariable: CreateStateVariableDeclaration | undefined;

    private actionDefinitions: ActionDefinition[] = [];

    constructor(sourceFile: ts.SourceFile) {
        this.stateSourceFile = sourceFile;
    }

    // The Identifier associated with 'createStateField' call. This is the name of the
    // State variable.
    public addCreateStateIdentifier(node: ts.Identifier) {
        this.createStateIdentifiers.addNodeObject(node);
    }

    // This is the actual action changing the state variable. e.g:
    //  [addConnectorWizardActionTypes.SetSelectedStep]:
    public addActionForStateVariable(actionName: string, actionNodePropertyAssignment: ts.PropertyAccessExpression) {
        if (this.currentActionStateVariable) {
            this.currentActionStateVariable.addActionPropertyExpression(actionName, actionNodePropertyAssignment);
        }
    }

    // Prints the State-> Action data in this source file.
    public print() {
        console.log('<h1>Printing Action Data in SourceFile: ' + this.stateSourceFile.fileName + '</h1>');
        this.createStateIdentifiers.print();
        this.createActionTypes.print();

        console.log('<h2>Printing StateVariable Action Data: </h2>');
        console.log('<table>');

        console.log('<tr>');
        console.log('<td><b>State Variable</b></td>');
        console.log('<td><b>Actions</b></td>');

        this.actionStateVariables.forEach(actionStateVariable => {
            actionStateVariable.print();
        });
        console.log('</table>');
    }

    public addActionDefinitionVariableDeclaration(node: ts.VariableDeclaration) {
        this.actionDefinitions.push(new ActionDefinition(node));
    }

    public addCreateActionTypes(node: ts.VariableDeclaration, createStateVariableDeclaration?: boolean) {
        this.createActionTypes.addNodeObject(node);

        // If this is a create state variable declaration, we try to parse out the action
        if (createStateVariableDeclaration) {
            this.processCreateStateVariableDeclaration(node);
        }
    }

    public getCurrentActionStateVariable(): CreateStateVariableDeclaration | undefined {
        return this.currentActionStateVariable;
    }

    public processCreateStateVariableDeclaration(node: ts.VariableDeclaration) {
        this.currentActionStateVariable = new CreateStateVariableDeclaration(node);
        this.actionStateVariables.push(this.currentActionStateVariable);
        this.currentActionStateVariable.process();
    }
}
