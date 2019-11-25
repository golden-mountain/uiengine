import _ from "lodash";
import { UIEngineRegister } from "../../UIEngineRegister";
import { createInstanceProxy } from "../../APIEngine";
import { IPlugin, IPluginMap } from "../../../../typings";

class PluginProxy {
  constructor(plugins?: any) {
    if (_.isArray(plugins)) {
      this.set(name);
    } else if (_.isString(plugins)) {
      this.get(plugins);
    }
  }

  get(name: string) {
    console.log("get a config");
  }

  set(nameOrPlugins: IPlugin[] | IPluginMap, plugin?: IPlugin) {
    UIEngineRegister.registerPlugins(nameOrPlugins);
  }
}

// callbacks
const PluginProxyGetCallback = function(target: any, key: string) {
  if (!_.isEmpty(target[key])) {
    return target[key];
  }

  return _.get(target.node, key);
};

const PluginProxySetCallback = function(target: any, key: string, value: any) {
  return _.set(target.node, key, value);
};

const plugin = function(this: any, path: string) {
  return createInstanceProxy(
    new PluginProxy(path),
    PluginProxyGetCallback,
    PluginProxySetCallback
  );
};

export default plugin;
