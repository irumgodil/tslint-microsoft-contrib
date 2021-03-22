import * as ts from 'typescript';
import { VariableDeclarationKind } from 'tsutils';
import { AstUtils } from '../../utils/AstUtils';

// Collection Object for State/Action Components.
// E.g. for expression:
// const x = createStateField('0', action...)
// X is stored as a state identifier for future parsing
// X in this case is an Identifier object, hence this class stores collections of ts.Node objects.
export abstract class ASelectorElement {
    public abstract print(): void;

    public abstract printTests(): void;

    // To-do: make this a separate sub-class.
    public abstract printAppState(varList: string[], isPrecedingSelector?: boolean): void;

    // To-do: make this a separate sub-class.
    public abstract addVarToStateList(arg: string): void;

    // To-do: make this a separate sub-class.
    public abstract removeVarFromStateList(arg: string): void;

    protected varName: string = '';

    protected isPrivateSelector: boolean = false;

    getName(): string {
        return this.varName;
    }
}
