import ts = require('typescript');

// Keeps track of processing of the selector declaration
export class ProcessingSelectorDeclarationStatus {
    /**
     * Set to true when createSelector/state.getIn is hit
     */
    public processingOn = false;

    // Track the variable declaration being processed, so we can store it when needed.
    public currentVariableBeingProcessed: ts.VariableDeclaration | undefined;

    /***
     * When we are in the createStateTraversal. The createStateField method's
     * second argument is a handler:
     * handlers: { [key: string]: ReducerFunction<S> }
     *
     * > So if we know we are traversing createStateField
     * > And have hit an objectLiteral expression, { [key: string]: ReducerFunction<S> }
     * > We watch out for propertyAssignment to turn on the flag that we are processing property assignment. This is helpful
     * as now in the children when we hit the PropertyAccessExpression, we can extract actions from there.
     */
    public processingObjectLiteral = false;

    /**
     * Used to track Property Access, once property assignment is hit.
     */
    public processingPropertyAssignment = false;

    public reset(): void {
        this.currentVariableBeingProcessed = undefined;
        this.processingOn = false;
        this.processingObjectLiteral = false;
        this.processingPropertyAssignment = false;
    }
}
