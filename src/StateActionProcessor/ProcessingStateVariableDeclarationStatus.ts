// Keeps track of processing of the State variable declaration to get the action contents.
export class ProcessingStateVariableDeclarationStatus {
    public processingOn = false;
    public processingObjectLiteral = false;
    public processingPropertyAssignment = false;

    public reset(): void {
        this.processingOn = false;
        this.processingObjectLiteral = false;
        this.processingPropertyAssignment = false;
    }
}
