import _ from "lodash";
import { createInstanceProxy } from "../../engine";

const StateNodeProxy: any = function(this: any) {};

StateNodeProxy.prototype.select = (selector: object, layoutId?: string) => {
  // const uiNodeProxy = new UINodeProxy()
};

// callbacks
const StateNodeProxyGetCallback = function(target: any, key: string) {
  if (!_.isEmpty(target[key])) {
    return target[key];
  }
  return _.get(target.node, key);
};

const StateNodeProxySetCallback = function(
  target: any,
  key: string,
  value: any
) {
  return _.set(target.node, key, value);
};

export const state = function(this: any) {
  return createInstanceProxy(
    new StateNodeProxy(),
    StateNodeProxyGetCallback,
    StateNodeProxySetCallback
  );
};
