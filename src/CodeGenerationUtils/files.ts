import * as fs from 'fs';
import * as ts from 'typescript';

function readFile(fileName) {
    return fs.readFileSync(fileName, { encoding: 'utf8' });
}

export function writeFile(fileName, data) {
    return fs.writeFileSync(fileName, data, { encoding: 'utf8' });
}

export function readJSON(fileName) {
    return JSON.parse(readFile(fileName));
}

export function writeTransformationToFile(result: ts.TransformationResult<ts.Node>, node: ts.SourceFile) {
    const transformedNodes = result.transformed[0];

    const printer: ts.Printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        removeComments: false
    });

    const output = printer.printNode(ts.EmitHint.SourceFile, transformedNodes, node);
    writeFile(node.fileName, output);
}
