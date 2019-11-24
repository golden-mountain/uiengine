import _ from "lodash";
import { createInstanceProxy } from "../engine";

class PluginProxy {
  constructor(name: string, config?: any) {}

  info(name: string) {
    console.log("get a config");
  }

  set(configs: string | object, value: any) {
    console.log("set config");
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

export const plugin = function(this: any, path: string, configObject?: any) {
  return createInstanceProxy(
    new PluginProxy(path, configObject),
    PluginProxyGetCallback,
    PluginProxySetCallback
  );
};
