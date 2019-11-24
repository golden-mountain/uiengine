import _ from "lodash";
import { createInstanceProxy } from "../engine";

class ConfigProxy {
  constructor(name: string, config: any) {}

  get(name: string) {
    console.log("get a config");
  }

  set(configs: string | object, value: any) {
    console.log("set config");
  }
}

// callbacks
const ConfigProxyGetCallback = function(target: any, key: string) {
  if (!_.isEmpty(target[key])) {
    return target[key];
  }

  return _.get(target.node, key);
};

const ConfigProxySetCallback = function(target: any, key: string, value: any) {
  return _.set(target.node, key, value);
};

export const config = function(this: any, path: string, configObject?: any) {
  return createInstanceProxy(
    new ConfigProxy(path, configObject),
    ConfigProxyGetCallback,
    ConfigProxySetCallback
  );
};
