import _ from "lodash";
import { createInstanceProxy } from "../../engine";

class ComponentProxy {
  constructor(name: string, component?: any) {
    if (!component) {
      this.get(name);
    } else {
      this.set(name, component);
    }
  }

  get(name: string) {
    console.log("get a config");
  }

  set(components: string | object, value: any) {
    console.log("set config");
  }
}

// callbacks
const ComponentProxyGetCallback = function(target: any, key: string) {
  if (!_.isEmpty(target[key])) {
    return target[key];
  }

  return _.get(target.node, key);
};

const ComponentProxySetCallback = function(
  target: any,
  key: string,
  value: any
) {
  return _.set(target.node, key, value);
};

const component = function(this: any, path: string, configObject?: any) {
  return createInstanceProxy(
    new ComponentProxy(path, configObject),
    ComponentProxyGetCallback,
    ComponentProxySetCallback
  );
};

export default component;
