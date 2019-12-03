import _ from "lodash";
import { createInstanceProxy } from "../../APIEngine";
import { layout } from "./layout";
import { schema } from "./schema";
import { data } from "../data";
import { state } from "../state";
import { IApiUI } from "../../../../typings/apis";

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
  }

  // selector could be an IUINodeProxyNode or SchemaSelector
  select(selector: object, layoutId?: string) {
    // fetch UINodeProxyNode
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
  if (!_.isNil(target[key])) {
    return target[key];
  }

  return _.get(target.node, key);
};

const UINodeProxySetCallback = function(target: any, key: string, value: any) {
  return _.set(target.node, key, value);
};

export const ui = <IApiUI>function(selector: any, layoutId?: string) {
  return createInstanceProxy<
    IApiUI
  >(new UINodeProxy(selector, layoutId), UINodeProxyGetCallback, UINodeProxySetCallback);
};

// access directly
ui.schema = schema;
ui.data = data;
ui.state = state;
ui.layout = layout;
