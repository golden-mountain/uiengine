import _ from "lodash";
import { createInstanceProxy } from "../../APIEngine";

class ComponentProxy {
  constructor(name: string, component?: any) {
    if (!component) {
      this.get(name);
    } else {
      this.set(name, component);
    }
  }

  get(name: string) {
    console.log("get a copmonent");
  }

  set(components: string | object, value: any) {
    console.log("set copmonent");
  }
}

// callbacks
const ComponentProxyGetCallback = function(target: any, key: string) {
  if (!_.isNil(target[key])) {
    return target[key];
  }

  return target.get(key);
};

const ComponentProxySetCallback = function(
  target: any,
  key: string,
  value: any
) {
  return target.set(key, value);
};

const component = function(this: any, path: string, configObject?: any) {
  return createInstanceProxy(
    new ComponentProxy(path, configObject),
    ComponentProxyGetCallback,
    ComponentProxySetCallback
  );
};

export default component;
