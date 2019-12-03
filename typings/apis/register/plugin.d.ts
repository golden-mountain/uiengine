export interface IApiRegisterPlugin {
  set: (nameOrPlugins: IPlugin[] | IPluginMap, plugin?: IPlugin) => boolean;
  get: (name?: string) => IPlugin;
}
