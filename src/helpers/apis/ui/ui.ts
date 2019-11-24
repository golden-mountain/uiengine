import _ from "lodash";
import { createInstanceProxy } from "../../engine";
import { layout } from "./layout";
import { schema } from "./schema";
import { data } from "../data";
import { state } from "../state";

class UINodeProxy {
  private instance: any;
  private node: any;
  schema = schema;
  data = data;
  state = state;
  layout = layout;

  constructor(selector: object, layoutId?: string) {
    this.node = null;
    this.instance = null;
    return this.select(selector, layoutId);
  }

  // selector could be an IUINodeProxyNode or SchemaSelector
  select(selector: object, layoutId?: string) {
    // fetch UINodeProxyNode
    this.instance = new UINodeProxy(selector);
    return this.instance;
  }

  delete() {}
  update(values: any) {}
  info(name: string) {}
  prop(name: string) {}
  parent(selector: any) {}
  children(selector: any) {}
  siblings(selector: any) {}
  closest(selector: any) {}
}

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
