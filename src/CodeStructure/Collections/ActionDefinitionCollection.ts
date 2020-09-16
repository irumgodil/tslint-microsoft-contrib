import { ActionDefinition } from './../ActionDefinition';
import { PossibleActionDefinition } from '../../StateActionProcessor/PossibleActionDefinition';

export class ActionDefinitionCollection {
    public static actionDefinitions: Map<string, ActionDefinition> = new Map<string, ActionDefinition>();

    public static addActionDefinitionVariableDeclaration(node: PossibleActionDefinition) {
        // IRUMTODO: Is there a better way to build ActionDef w/o PossibleActionDefinition.
        const action = new ActionDefinition(
            node.enclosingVariableDeclaration,
            node.enclosingObjectLiteralDefinition,
            node.typeDeclaration,
            node.payloadDeclaration
        );

        // IRUMTODO: May need to add this by source-file.
        ActionDefinitionCollection.actionDefinitions.set(action.getActionType(), action);
        //console.log("Added Action: " + action.getActionType() + " " + ActionDefinitionCollection.actionDefinitions.size);
    }
}
