import * as ts from 'typescript';

import { StateActionComponentCollection } from './StateActionComponentCollection';

export class IdentifierActionObjectCollection extends StateActionComponentCollection {
    public print(): void {
        this.stateActionComponentObject.forEach(element => {
            // tslint-disable:next-line
            console.log('<div className="stateIdentifier">-----Found State/Action Variable: ' + (element as ts.Identifier).text + '</div>');
        });
    }
}
