import * as ts from 'typescript';
import { VariableDeclarationKind } from 'tsutils';

// Collection Object for State/Action Components.
// E.g. for expression:
// const x = createStateField('0', action...)
// X is stored as a state identifier for future parsing
// X in this case is an Identifier object, hence this class stores collections of ts.Node objects.
export abstract class ASelectorElement {
    public abstract print(): void;

    public abstract printTests(): void;

    // To-do: make this a separate sub-class.
    public abstract printAppState(): void;

    // To-do: make this a separate sub-class.
    public addVarToStateList(arg: string): void {}

    protected varName: string = '';

    public getName(): string {
        return this.varName;
    }
}
