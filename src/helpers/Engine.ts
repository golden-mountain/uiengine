import _ from "lodash";
import * as apis from "./apis";

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

export function createInstanceProxy(
  instance: any,
  setCallback?: any,
  getCallback?: any
) {
  return new Proxy(instance, new EngineInstanceProxy(setCallback, getCallback));
}

export function engine() {
  console.log("UIengine Apis Version 0.1");
}

// register apis
_.forEach(apis as any, (name: string, api: any) => {
  engine[name] = api;
});

export default engine;
