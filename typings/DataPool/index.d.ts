export interface IDataPool {
  data: object;
  pluginManager: IPluginManager;
  set(data: any, path?: string);
  get(paths: Array<string>);
  clear();
}
