import * as ts from 'typescript';

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

    public addActionDefinitionVariableDeclaration(node: ts.VariableDeclaration) {
        this.actionDefinitions.push(new ActionDefinition(node));
    }

    public addCreateStateIdentifier(node: ts.Identifier) {
        this.createStateIdentifiers.addCreateStateObject(node);
    }

    public addCreateActionTypes(node: ts.VariableDeclaration, createStateVariableDeclaration?: boolean) {
        this.createActionTypes.addCreateStateObject(node);

        if (createStateVariableDeclaration) {
            this.processCreateStateVariableDeclaration(node);
        }
    }

    public getCurrentActionStateVariable(): CreateStateVariableDeclaration | undefined {
        return this.currentActionStateVariable;
    }

    public addActionForStateVariable(actionName: string, actionNodePropertyAssignment: ts.PropertyAccessExpression) {
        if (this.currentActionStateVariable) {
            this.currentActionStateVariable.addActionPropertyExpression(actionName, actionNodePropertyAssignment);
        }
    }

    public processCreateStateVariableDeclaration(node: ts.VariableDeclaration) {
        this.currentActionStateVariable = new CreateStateVariableDeclaration(node);
        this.actionStateVariables.push(this.currentActionStateVariable);
        this.currentActionStateVariable.process();
    }

    public print() {
        console.log('<html>');
        console.log('<head><style>table {background-color: powderblue;}tr{border: solid}td{border: solid}</style></head>');
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
        console.log('</html>');
    }
}

export abstract class ActionObjectCollection {
    public createStateObjects: ts.Node[] = [];

    public addCreateStateObject(node: ts.Node) {
        this.createStateObjects.push(node);
    }

    public abstract print(): void;
}

// IRUMTODO: why is this not ActionObjectCollection
export class ActionDefinition {
    public actionVariableDeclaration: ts.VariableDeclaration;
    public actionName: string | undefined;

    constructor(actionVariableDeclaration: ts.VariableDeclaration) {
        this.actionVariableDeclaration = actionVariableDeclaration;
        this.processActionDefinition();
    }

    public processActionDefinition() {}
}

export class CreateStateVariableDeclaration {
    private overallDeclaration: ts.VariableDeclaration;

    private actionPropertyExpressions: Map<string, ts.PropertyAccessExpression> = new Map();
    private varName: string = '';

    constructor(createStateVar: ts.VariableDeclaration) {
        this.overallDeclaration = createStateVar;
        this.setName();
    }

    public addActionPropertyExpression(actionName: string, propertyAccessExpression: ts.PropertyAccessExpression) {
        this.actionPropertyExpressions.set(actionName, propertyAccessExpression);
    }

    private setName(): void {
        const identifierObject = this.overallDeclaration.name as ts.Identifier;
        this.varName = identifierObject.escapedText.toString();
    }

    public process(): void {
        //   const initializer: ts.CallExpression = (this.overallDeclaration.initializer as ts.CallExpression);
        // const args = initializer.arguments;
        // const objectInitializer: ts.ObjectLiteralExpression = args[1] as ts.ObjectLiteralExpression;
        //  console.log("Initializer Type arguments: " + objectInitializer._leftHandSideExpressionBrand);
        /*if (args) {
            args.forEach(arg => {
                console.log("Initializer Type arguments: " + arg);
            });
        }*/
    }

    public print(): void {
        console.log('<tr>');
        console.log('<td><b>' + this.varName + '</b></td>');

        console.log('<td>');

        this.actionPropertyExpressions.forEach((_value: ts.PropertyAccessExpression, key: string) => {
            console.log('<div>' + key + '</div>');
        });

        console.log('</td></tr>');
    }
}

export class VariableDeclaration extends ActionObjectCollection {
    public print(): void {
        this.createStateObjects.forEach(element => {
            console.log('<div>-----Found actionObject: ' + (element as ts.VariableDeclaration).getText() + '</div>');
        });
    }
}

export class IdentifierActionObjectCollection extends ActionObjectCollection {
    public print(): void {
        this.createStateObjects.forEach(element => {
            console.log('<div>-----Found actionObject: ' + (element as ts.Identifier).text + '</div>');
        });
    }
}
