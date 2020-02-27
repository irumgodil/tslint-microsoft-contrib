import ts = require('typescript');

// Keeps track of processing of the selector declaration
export class ProcessingSelectorDeclarationStatus {
    /**
     * Set to true when createSelector is hit
     */
    public processingCreateSelectorOn = false;

    public createSelectorExpression: ts.CallExpression | undefined;

    /**
     * Set to true when createSelector/state.getIn is hit
     */
    public processingOn = false;

    // Track the variable declaration being processed, so we can store it when needed.
    public currentVariableBeingProcessed: ts.VariableDeclaration | undefined;

    public reset(): void {
        this.currentVariableBeingProcessed = undefined;
        this.createSelectorExpression = undefined;
        this.processingOn = false;

        this.processingCreateSelectorOn = false;
    }
}
