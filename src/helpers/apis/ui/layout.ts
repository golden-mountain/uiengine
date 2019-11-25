import { ILayoutSchema } from "../../../../typings";
import _ from "lodash";
import { createInstanceProxy } from "../../APIEngine";

class LayoutProxy {
  constructor(name: string) {}

  active(name?: string) {
    console.log("get a config");
  }

  get(name?: string) {
    console.log("get a config");
  }

  select(name?: string) {
    return this.get(name);
  }

  replaceWith(layoutObject?: ILayoutSchema) {
    // return this.get(name);
  }
}

// callbacks
const LayoutProxyGetCallback = function(target: any, key: string) {
  if (!_.isEmpty(target[key])) {
    return target[key];
  }

  return _.get(target.node, key);
};

const LayoutProxySetCallback = function(target: any, key: string, value: any) {
  return _.set(target.node, key, value);
};

export const layout = function(this: any, name: string) {
  return createInstanceProxy(
    new LayoutProxy(name),
    LayoutProxyGetCallback,
    LayoutProxySetCallback
  );
};
