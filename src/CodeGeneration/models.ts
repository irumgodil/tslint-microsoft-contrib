import * as fs from 'fs';

// Sample Data:

export class RuleValue {
    public name: string;
    public parameters: Parameter[];
}

export class Parameter {
    public key: string;
    public value: string;
}
