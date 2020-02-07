import * as ts from 'typescript';

// IRUMTODO: why is this not StateActionComponentCollection
export class ActionDefinition {
    public actionVariableDeclaration: ts.VariableDeclaration;
    public actionName: string | undefined;

    constructor(actionVariableDeclaration: ts.VariableDeclaration) {
        this.actionVariableDeclaration = actionVariableDeclaration;
        this.processActionDefinition();
    }

    public processActionDefinition() {}
}
