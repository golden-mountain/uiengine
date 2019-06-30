import { IState, IStateNode, IErrorInfo, IPluginManager } from "../../typings";
import { IUINode } from "../../typings/UINode";
export default class StateNode implements IStateNode {
    errorInfo: IErrorInfo;
    state: IState;
    uiNode: IUINode;
    pluginManager: IPluginManager;
    constructor(uiNode: IUINode);
    getUINode(): IUINode;
    getState(key?: string): any;
    renewStates(uiNode?: IUINode): Promise<{
        state: any;
        data: any;
    }>;
    setState(key: string, value: any): IState;
    getPluginManager(): IPluginManager;
}
