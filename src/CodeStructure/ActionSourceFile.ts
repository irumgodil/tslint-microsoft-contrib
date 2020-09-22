import * as ts from 'typescript';
import { IdentifierActionObjectCollection } from './ActionComponents/IdentifierActionObjectCollection';
import { CreateStateVariableDeclaration } from './CreateStateVariableDeclaration';

import { VariableDeclaration } from './ActionComponents/VariableDeclaration';
import { ActionDefinition } from './ActionDefinition';
import { PossibleActionDefinition } from '../StateActionProcessor/PossibleActionDefinition';

export class ActionSourceFile {
    // The source file.
    public stateSourceFile: ts.SourceFile;

    // The list of 'createStateField' state variables - that are used for the reducer testing.
    private actionStateVariables: CreateStateVariableDeclaration[] = [];

    private createStateIdentifiers: IdentifierActionObjectCollection = new IdentifierActionObjectCollection();
    private createActionTypes: VariableDeclaration = new VariableDeclaration();

    // The current 'stateVariable' being worked upon in order to process data on the current state variable.
    private currentActionStateVariable: CreateStateVariableDeclaration | undefined;

    constructor(sourceFile: ts.SourceFile) {
        this.stateSourceFile = sourceFile;
    }

    /***
     * There are 2 instances of this code:
     * > When createStateField is hit, the variableDecarlation is used to create a new CreateStateVariableDeclaration
     *  this class contains data about the state variable.
     *
     * > In the second instance, this method is used to track 'createActionTypes' calls.
     */
    public addCreateActionTypes(node: ts.VariableDeclaration, createStateVariableDeclaration?: boolean) {
        this.createActionTypes.addNodeObject(node);

        // If this is a create state variable declaration, we try to parse out the action
        if (createStateVariableDeclaration) {
            this.processCreateStateVariableDeclaration(node);
        }
    }

    public processCreateStateVariableDeclaration(node: ts.VariableDeclaration) {
        this.currentActionStateVariable = new CreateStateVariableDeclaration(node);
        this.actionStateVariables.push(this.currentActionStateVariable);
        this.currentActionStateVariable.process();
    }

    // This is the actual action changing the state variable. e.g:
    // The propertyAccessExpression is this part of the createStateField code.
    // [connectorInfoActionTypes.ResetUpdateComponent]
    public addActionForStateVariable(actionName: string, actionNodePropertyAssignment: ts.PropertyAccessExpression) {
        if (this.currentActionStateVariable) {
            this.currentActionStateVariable.addActionPropertyExpression(actionName, actionNodePropertyAssignment);
        }
    }

    // The Identifier associated with 'createStateField' call. This is the name of the
    // State variable.
    public addCreateStateIdentifier(node: ts.Identifier) {
        this.createStateIdentifiers.addNodeObject(node);
    }

    // Prints the State-> Action data in this source file.
    public print() {
            if (this.actionStateVariables.length > 0) {
                const fileId = this.stateSourceFile.fileName.replace(/(\/|\.|\:|\-)/g, '_');
                console.log(
                    '<div><a href="#' + fileId + '" data-toggle="collapse">Reducer Tests for: ' + this.stateSourceFile.fileName + '</a></div>'
                );
                this.createStateIdentifiers.print();
                this.createActionTypes.print();

                if (this.actionStateVariables.length > 0) {
                    console.log('<table id="' + fileId + '"  class="collapse">');

                    console.log('<tr>');
                    console.log('<td><b>State Variable Data:</b></td>');


                    console.log('<td><b>Tests</b></td>');

                    this.actionStateVariables.forEach(actionStateVariable => {
                        actionStateVariable.print();
                    });

                    console.log('</table>');
                } else {
                    console.log('<h3>No data found</h2>');
                }
            }

    }

    public getCurrentActionStateVariable(): CreateStateVariableDeclaration | undefined {
        return this.currentActionStateVariable;
    }
}
