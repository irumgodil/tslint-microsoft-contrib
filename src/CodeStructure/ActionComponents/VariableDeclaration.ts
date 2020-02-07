import * as ts from 'typescript';
import { StateActionComponentCollection } from './StateActionComponentCollection';

export class VariableDeclaration extends StateActionComponentCollection {
    public print(): void {
        this.stateActionComponentObject.forEach(element => {
            console.log(
                '<div className="actionVariableIdentifier">-----Found actionObject: ' +
                    (element as ts.VariableDeclaration).getText() +
                    '</div>'
            );
        });
    }
}
