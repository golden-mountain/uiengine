import _ from "lodash";
import { createInstanceProxy } from "../../APIEngine";

class ListenerProxy {
  constructor(name: string, plugin?: any) {
    if (!plugin) {
      this.get(name);
    } else {
      this.set(name, plugin);
    }
  }

  get(name: string) {
    console.log("get a config");
  }

  set(configs: string | object, value: any) {
    console.log("set config");
  }
}

// callbacks
const ListenerProxyGetCallback = function(target: any, key: string) {
  if (!_.isNil(target[key])) {
    return target[key];
  }

  return target.get(key);
};

const ListenerProxySetCallback = function(
  target: any,
  key: string,
  value: any
) {
  return target.set(key, value);
};

const listener = function(this: any, path: string, configObject?: any) {
  return createInstanceProxy(
    new ListenerProxy(path, configObject),
    ListenerProxyGetCallback,
    ListenerProxySetCallback
  );
};

export default listener;
