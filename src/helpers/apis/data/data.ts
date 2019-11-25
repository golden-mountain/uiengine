import _ from "lodash";
import { createInstanceProxy } from "../../APIEngine";
import { IApiData } from "../../../../typings/apis";

class DataNodeProxy {
  constructor() {}

  select(selector: object, layoutId?: string) {
    // const uiNodeProxy = new UINodeProxy()
  }
}
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

export const data: IApiData = createInstanceProxy<IApiData>(
  new DataNodeProxy(),
  DataNodeProxyGetCallback,
  DataNodeProxySetCallback
);
