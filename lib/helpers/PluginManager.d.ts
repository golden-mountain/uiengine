import { IPluginManager, IPlugins, IErrorInfo, IPlugin, IPluginExecutionConfig } from "../../typings";
export default class PluginManager implements IPluginManager {
    static plugins: IPlugins;
    private caller;
    result: object;
    errorInfo: IErrorInfo;
    constructor(caller: any, plugins?: IPlugins);
    getPlugins(type?: string, name?: string): any;
    static getPlugins(type?: string, name?: string): any;
    unloadPlugins(type?: string, name?: string): void;
    static unloadPlugins(type?: string, name?: string): void;
    loadPlugins(newPlugins: IPlugins): IPlugins;
    static loadPlugins(newPlugins: IPlugins): IPlugins;
    executePlugins(type: string, config?: IPluginExecutionConfig, options?: any): Promise<any>;
    executeSyncPlugins(type: string, config?: IPluginExecutionConfig, options?: any): any;
    executePlugin(plugin: IPlugin, options?: any): any;
    setErrorInfo(type: string, name: string, value: any): IErrorInfo;
}
