// Keeps track of processing of the State variable declaration to get the action contents.
export class ProcessingStateVariableDeclarationStatus {
    /**
     * Set to true when createStateField is hit
     */
    public processingOn = false;

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
        this.processingOn = false;
        this.processingObjectLiteral = false;
        this.processingPropertyAssignment = false;
    }
}
