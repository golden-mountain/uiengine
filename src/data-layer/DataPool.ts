import { DataEngine, PluginManager } from "../";
import { IDataPool, IDataEngine, IPluginManager } from "../../typings";

export default class DataPool {
  static instance: IDataPool;
  static getInstance = () => {
    if (!DataPool.instance) {
      DataPool.instance = new DataPool();
    }
    return DataPool.instance as DataPool;
  };

  data: object = {};
  pluginManager: IPluginManager = new PluginManager(this);

  set(data: any, path?: string) {}

  get(paths: Array<string>) {}

  clear() {}
}
