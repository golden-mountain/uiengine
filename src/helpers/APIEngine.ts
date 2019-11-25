import _ from "lodash";
import * as apis from "./apis";
import {
  IApiConfig,
  IApiRequest,
  IApiEngine,
  IApiRegister,
  IApiPlugin,
  IApiUI,
  IAPIUIConstructor,
  IApiState,
  IApiData
} from "../../typings/apis";

class EngineInstanceProxy {
  private setCallback?: any;
  private getCallback?: any;
  constructor(setCallback?: any, getCallback?: any) {
    // this.instance = instance;
    this.setCallback = setCallback;
    this.getCallback = getCallback;
  }

  get(target: any, key: string) {
    if (_.isFunction(this.getCallback)) return this.getCallback(target, key);
    return target[key] || null;
  }

  set(target: any, key: string, value: any): boolean {
    if (_.isFunction(this.setCallback))
      return this.setCallback(target, key, value);
    try {
      target[key] = value;
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  }
}

export function createInstanceProxy<T>(
  instance: any,
  setCallback?: any,
  getCallback?: any
): T {
  return new Proxy(instance, new EngineInstanceProxy(setCallback, getCallback));
}

// register apis
class APIEngine implements IApiEngine {
  register: IApiRegister = apis.register;
  config: IApiConfig = apis.config;
  request: IApiRequest = apis.request;
  plugin: IApiPlugin = apis.plugin;

  ui: IApiUI = apis.ui as any;
  data: IApiData = apis.data as any;
  state: IApiState = apis.state as any;

  constructor() {
    // register apis
    // _.forEach(apis as any, (name: string, api: any) => {
    //   this[name] = api;
    // });
  }
}

export default new APIEngine();
