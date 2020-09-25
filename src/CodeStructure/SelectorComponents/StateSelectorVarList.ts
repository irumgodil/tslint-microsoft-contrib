import * as ts from 'typescript';

/*
export const udtStatesSelector = (state: AppState) => {
  return state.getIn(['microsoftSearch', 'udtStates'])
}
*/
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

    public addVar(arg: string): void {
        this.varList.push(arg);
    }

    /**
     * This is the table that is printed in the main html for test cases.
     */
    public print(): void {
        this.varList.forEach((node: string) => {
            console.log('<div class="describe">' + node + ': { </div>' );
        });
    }

    public printTests(finalValueBeingSet?: string): void {
        let padding = 30;
        this.varList.forEach((node: string, index: number) => {
            let paddingStyle = 'style="font-style: italic; font-size:12; padding-left:' + padding + '"';
            console.log('</div><div ' + paddingStyle + '>');
            if (index !== this.varList.length - 1) {
                console.log(node + ': {');
                padding += 10;
            } else {
                console.log(node + ': {');

                if (finalValueBeingSet) {
                    console.log('</div><div ' + paddingStyle + '>');
                    padding += 10;
                    console.log(finalValueBeingSet + ':');
                }
                paddingStyle = 'style="font-style: italic; font-size:12; padding-left:' + padding + '"';
                console.log('</div><div ' + paddingStyle + '>');
                console.log('expectedResult');

                if (finalValueBeingSet) {
                    paddingStyle = 'style="font-style: italic; font-size:12; padding-left:' + padding + '"';
                    padding -= 10;
                    console.log('</div><div ' + paddingStyle + '>');
                    padding -= 10;
                }
            }
            console.log('</div>');
        });

        this.varList.forEach((_node: string, index: number) => {
            const paddingStyle = 'style="font-size:12; padding-left:' + padding + '"';
            if (index !== this.varList.length - 1) {
                console.log('</div><div ' + paddingStyle + '>');
                console.log('}');
                console.log('</div>');
            }
            padding -= 10;
        });
    }
}
