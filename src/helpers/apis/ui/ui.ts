import _ from "lodash";
import { createInstanceProxy } from "../../engine";
import layout from "./layout";
import schema from "./schema";
import { data } from "../data";
import { state } from "../state";

const UINodeProxy: any = function(
  this: any,
  selector: object,
  layoutId?: string
) {
  this.node = null;
  this.instance = null;
  return this.select(selector, layoutId);
};

// selector could be an IUINodeProxyNode or SchemaSelector
UINodeProxy.prototype.select = function(selector: object, layoutId?: string) {
  // fetch UINodeProxyNode
  this.instance = new UINodeProxy(selector);
  return this.instance;
};

UINodeProxy.prototype.schema = schema;
UINodeProxy.prototype.data = data;
UINodeProxy.prototype.state = state;
UINodeProxy.prototype.layout = layout;
UINodeProxy.prototype.delete = function() {};
UINodeProxy.prototype.update = function(values: any) {};
UINodeProxy.prototype.info = function(name: string) {};
UINodeProxy.prototype.prop = function(name: string) {};
UINodeProxy.prototype.parent = function(selector: any) {};
UINodeProxy.prototype.children = function(selector: any) {};
UINodeProxy.prototype.siblings = function(selector: any) {};
UINodeProxy.prototype.closest = function(selector: any) {};
UINodeProxy.prototype.layout = layout;

// callbacks
const UINodeProxyGetCallback = function(target: any, key: string) {
  if (!_.isEmpty(target[key])) {
    return target[key];
  }

  return _.get(target.node, key);
};

const UINodeProxySetCallback = function(target: any, key: string, value: any) {
  return _.set(target.node, key, value);
};

export const ui = function(this: any, selector: object, layoutId?: string) {
  return createInstanceProxy(
    new UINodeProxy(selector, layoutId),
    UINodeProxyGetCallback,
    UINodeProxySetCallback
  );
};
