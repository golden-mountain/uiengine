import _ from "lodash";
import { createInstanceProxy } from "../../APIEngine";

class SchemaProxy {
  constructor(name: string, config?: any) {}

  get(name: string) {
    console.log("get a schema");
  }

  set(name: string | object, value?: any) {
    console.log("set schema");
  }

  update(name: string | object, value?: any) {
    console.log("set schema");
  }
}

// callbacks
const SchemaProxyGetCallback = function(target: any, key: string) {
  if (!_.isEmpty(target[key])) {
    return target[key];
  }

  return _.get(target.node, key);
};

const SchemaProxySetCallback = function(target: any, key: string, value: any) {
  return _.set(target.node, key, value);
};

export const schema = function(this: any, path: string, configObject?: any) {
  return createInstanceProxy(
    new SchemaProxy(path, configObject),
    SchemaProxyGetCallback,
    SchemaProxySetCallback
  );
};
