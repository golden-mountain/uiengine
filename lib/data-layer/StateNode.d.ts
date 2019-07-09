import { IState, IStateNode, IErrorInfo, IPluginManager, IUINode } from "../../typings";
export default class StateNode implements IStateNode {
    errorInfo: IErrorInfo;
    state: IState;
    uiNode: IUINode;
    pluginManager: IPluginManager;
    constructor(uiNode: IUINode);
    getUINode(): IUINode;
    getState(key?: string): any;
    renewStates(): Promise<IState>;
    setState(key: string, value: any): IState;
    getPluginManager(): IPluginManager;
}
