import _ from "lodash";
import {
  IPluginManager,
  IPlugins,
  IErrorInfo,
  IPlugin,
  IPluginExecutionConfig
} from "../../typings";

export default class PluginManager implements IPluginManager {
  static plugins: IPlugins = {};
  private caller: any;
  result: object = {};
  errorInfo: IErrorInfo = {};

  constructor(caller: any, plugins?: IPlugins) {
    if (plugins) {
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

  static unloadPlugins(type?: string, name?: string) {
    if (name && type) {
      _.unset(PluginManager.plugins, `${type}.${name}`);
    } else if (type) {
      _.unset(PluginManager.plugins, type);
    } else {
      PluginManager.plugins = {};
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

  async executePlugins(type: string, config?: IPluginExecutionConfig) {
    const plugins: IPlugins = _.get(PluginManager.plugins, type);
    let result;
    for (let k in plugins) {
      const p = plugins[k];
      const name = p.name || k;
      try {
        result = await p.callback.call(this.caller, this.caller);
        _.set(this.result, `${type}.${name}`, result);

        // break conditions
        if (_.isEqual(_.get(config, "stopWhenEmpty"), result)) break;
        if (_.isEqual(_.get(config, "executeOnlyPlugin"), name)) break;
      } catch (e) {
        this.setErrorInfo(p.type, name, e.message);
      }
    }
    if (_.get(config, "returnLastValue")) {
      return result;
    }
    return _.get(this.result, type, {});
  }

  setErrorInfo(type: string, name: string, value: any): IErrorInfo {
    _.set(this.errorInfo, `${type}.${name}`, value);
    return this.errorInfo;
  }
}
