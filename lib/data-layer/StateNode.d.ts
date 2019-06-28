import { IState, IStateNode, IErrorInfo, IPluginManager } from "../../typings";
import { IUINode } from "../../typings/UINode";
export default class StateNode implements IStateNode {
    errorInfo: IErrorInfo;
    state: IState;
    uiNode: IUINode;
    plugins: object;
    pluginManager: IPluginManager;
    constructor(uiNode: IUINode, loadDefaultPlugins?: boolean);
    getUINode(): IUINode;
    getState(key?: string): any;
    getPlugins(key?: string): object;
    renewStates(): Promise<IState>;
    setState(key: string, value: any): IState;
    getPluginManager(): IPluginManager;
}
