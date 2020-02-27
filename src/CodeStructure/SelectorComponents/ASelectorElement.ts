import * as ts from 'typescript';

// Collection Object for State/Action Components.
// E.g. for expression:
// const x = createStateField('0', action...)
// X is stored as a state identifier for future parsing
// X in this case is an Identifier object, hence this class stores collections of ts.Node objects.
export abstract class ASelectorElement {
    public abstract print(): void;

    protected varName: string = '';

    public getName(): string {
        return this.varName;
    }
}
