import _ from "lodash";
import { createInstanceProxy } from "../APIEngine";

class PluginProxy {
  constructor(name: string) {}

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

export const plugin = function(this: any, path: string) {
  return createInstanceProxy(
    new PluginProxy(path),
    PluginProxyGetCallback,
    PluginProxySetCallback
  );
};
