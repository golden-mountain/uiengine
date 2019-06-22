import _ from "lodash";
import { IPluginManager, IPlugins, IErrorInfo, IPlugin } from "../../typings";

export default class PluginManager implements IPluginManager {
  static plugins: IPlugins = {};
  private caller: any;
  result: object = {};
  errorInfo: IErrorInfo = {};

  constructor(caller: any, plugins?: IPlugins) {
    if (plugins && _.isEmpty(PluginManager.plugins)) {
      this.loadPlugins(plugins);
    }
    this.caller = caller;
  }

  getPlugins(type?: string, name?: string) {
    if (name && type) {
      return _.get(PluginManager.plugins, `${type}.${name}`);
    } else if (type) {
      return _.get(PluginManager.plugins, type);
    } else {
      return PluginManager.plugins;
    }
  }

  unloadPlugins(type: string, name?: string) {
    if (name) {
      _.unset(PluginManager.plugins, `${type}.${name}`);
    } else {
      _.unset(PluginManager.plugins, type);
    }
  }

  loadPlugins(newPlugins: IPlugins): IPlugins {
    _.forIn(newPlugins, (p: IPlugin, key: string) => {
      if (p.type) {
        const name = p.name || key;
        _.set(PluginManager.plugins, `${p.type}.${name}`, p);
      }
    });
    return PluginManager.plugins;
  }

  async executePlugins(type: string) {
    const plugins: IPlugins = _.get(PluginManager.plugins, type);
    for (let k in plugins) {
      const p = plugins[k];
      const name = p.name || k;
      try {
        const result = await p.callback.call(this.caller, this.caller);
        _.set(this.result, `${type}.${name}`, result);
      } catch (e) {
        this.setErrorInfo(p.type, name, e.message);
      }
    }
    return _.get(this.result, type, {});
  }

  setErrorInfo(type: string, name: string, value: any): IErrorInfo {
    _.set(this.errorInfo, `${type}.${name}`, value);
    return this.errorInfo;
  }
}
