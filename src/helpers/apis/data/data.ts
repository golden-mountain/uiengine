import _ from "lodash";
import { createInstanceProxy } from "../../engine";

export const DataNodeProxy: any = function(this: any) {};

DataNodeProxy.prototype.select = (selector: object, layoutId?: string) => {
  // const uiNodeProxy = new UINodeProxy()
};

// callbacks
const DataNodeProxyGetCallback = function(target: any, key: string) {
  if (!_.isEmpty(target[key])) {
    return target[key];
  }
  return _.get(target.node, key);
};

const DataNodeProxySetCallback = function(
  target: any,
  key: string,
  value: any
) {
  return _.set(target.node, key, value);
};

export const data = function(this: any) {
  return createInstanceProxy(
    new DataNodeProxy(),
    DataNodeProxyGetCallback,
    DataNodeProxySetCallback
  );
};
