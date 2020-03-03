import * as ts from 'typescript';

export class StateSelectorVarList {
    // the list of values being modified as a result of this state variable. e.g. in case of:
    // return state.getIn(['microsoftSearch', 'connectorList', 'isAddConnectorWizardOpened']), it is the 3 strings
    // 'microsoftSearch', 'connectorList', 'isAddConnectorWizardOpened' in this order only.
    public varList: string[] = [];

    /**
     * Gets the initializer Value of this State variable.
     *
     * Logic:
     * > Pull out the initializer part of the Variable Declaration and checks its arguments.
     * > Takes the first argument of the initializer as the initialization value.
     *
     * */
    public addVarList(args: ts.NodeArray<ts.Expression>): void {
        // Populate the call expression arguments.
        args.forEach((node: ts.Expression) => {
            // To-do: What happens if expression is not an array literal.
            if (ts.isArrayLiteralExpression(node)) {
                (node as ts.ArrayLiteralExpression).forEachChild((child: ts.Node) => {
                    // To-do: What happens if expression is not a string.
                    this.varList.push(child.getFullText());
                });
            }
        });
    }

    /**
     * This is the table that is printed in the main html for test cases.
     */
    public print(): void {
        this.varList.forEach((node: string) => {
            console.log(node + ': {');
        });
    }

    public printTests(): void {
        this.varList.forEach((node: string, index: number) => {
            console.log('<div>');

            if (index !== this.varList.length - 1) {
                console.log(node + ': {');
            } else {
                console.log(node + ': ');
                console.log('FilloutExpectedValue');
            }

            console.log('</div>');
        });

        this.varList.forEach((_node: string, index: number) => {
            if (index !== this.varList.length - 1) {
                console.log('<div>');
                console.log('}');
                console.log('</div>');
            }
        });
    }
}
