import _ from "lodash";
import { createInstanceProxy } from "../APIEngine";

class RequestProxy {
  constructor(path: string, configObject?: any) {}

  get(path: string, configObject?: any) {
    console.log("get a request");
  }
}

// callbacks
const RequestProxyGetCallback = function(target: any, key: string) {
  if (!_.isEmpty(target[key])) {
    return target[key];
  }

  return _.get(target.node, key);
};

const RequestProxySetCallback = function(target: any, key: string, value: any) {
  return _.set(target.node, key, value);
};

export const request = function(this: any, path: string, configObject?: any) {
  return createInstanceProxy(
    new RequestProxy(path, configObject),
    RequestProxyGetCallback,
    RequestProxySetCallback
  );
};
