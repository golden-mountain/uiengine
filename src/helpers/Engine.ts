import * as apis from "./apis";

class EngineApiFactory {
  static classes = {};

  static register(cls: any) {
    Object.assign(EngineApiFactory.classes, cls);
  }

  get(target: any, key: string) {
    //     console.log(`getting ${key}!`, key, value, receiver);
    //     return Reflect.get(target, key, receiver);
    console.log(key, EngineApiFactory.classes);
    return EngineApiFactory.classes[key] || null;
  }
}
EngineApiFactory.register(apis);
export default new Proxy({}, new EngineApiFactory());
