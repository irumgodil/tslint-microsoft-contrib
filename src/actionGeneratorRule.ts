// tslint:disable
import * as ts from 'typescript';
import * as fs from 'fs';
import * as Lint from 'tslint';

import * as Files from './CodeGenerationUtils/files';

import { ExtendedMetadata } from './utils/ExtendedMetadata';
import { RuleValue } from './CodeGeneration/models';
import { isCreateAction, getObjectLiteralPartOfActionType, addToObjectLiteralArray } from './CodeGenerationUtils/ActionStateUtils';
import { writeTransformationToFile } from './CodeGenerationUtils/files';

// IRUMTODO:  Move to const
const fileNameForRule = 'c:/Users/igodil.Redmond/codeGen/codegen.txt';

export class Rule extends Lint.Rules.AbstractRule {
    public static metadata: ExtendedMetadata = {
        ruleName: 'action-generator',
        type: 'maintainability',
        description: 'All files must have a top level JSDoc comment.',
        options: null, // tslint:disable-line:no-null-keyword
        optionsDescription: '',
        typescriptOnly: true,
        issueClass: 'Ignored',
        issueType: 'Warning',
        severity: 'Low',
        level: 'Opportunity for Excellence',
        group: 'Deprecated',
        recommendation: 'false'
    };

    public static FAILURE_STRING: string = 'File missing JSDoc comment at the top-level.';

    private readFile(): void {
        const ruleData = Files.readJSON(fileNameForRule) as RuleValue;
        console.log(ruleData);
        console.log(ruleData.name);
    }

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        this.readFile();
        return this.applyWithFunction(sourceFile, walk);
    }
}

function walk(ctx: Lint.WalkContext<void>) {
    const node: ts.SourceFile = ctx.sourceFile;

    const transformer = <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => {
        function visit(node: ts.Node): ts.Node {
            /* console.log("Visiting " + ts.SyntaxKind[node.kind]);*/
            node = ts.visitEachChild(node, visit, context);
            if (node.kind === ts.SyntaxKind.CallExpression) {
                const callExpression = node as ts.CallExpression;
                if (isCreateAction(callExpression)) {
                    const objectLiteralPart = getObjectLiteralPartOfActionType(callExpression);

                    const newObjectLiteral = addToObjectLiteralArray(objectLiteralPart, 'test', 'test');
                    // Add to the object literal part.
                    const newCallExpression = ts.createCall(callExpression.expression, callExpression.typeArguments, [
                        newObjectLiteral,
                        callExpression.arguments[1]
                    ]);
                    return newCallExpression;
                }
            }

            return node;
        }

        return ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(node, [transformer]);

    writeTransformationToFile(result, node);
}
