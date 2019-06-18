import { ICache } from "../../typings/DataNode";
import _ from "lodash";

export default class Cache {
  static cache: ICache = {
    dataSchema: {},
    data: {},
    layoutSchema: {}
  };

  // static schema: ICache = {};
  static clearCache = (type: string, schemaPath?: string) => {
    if (schemaPath) {
      _.set(Cache.cache, `${type}.${schemaPath}`, {});
      //   Cache.cache[type][schemaPath] = {};
    } else if (type) {
      _.set(Cache.cache, type, {});
    } else {
      Cache.cache = {};
    }
  };

  static clearDataCache() {
    Cache.clearCache("data");
  }

  static clearDataSchemaCache() {
    Cache.clearCache("dataSchema");
  }

  static clearLayoutSchemaCache() {
    Cache.clearCache("layoutSchema");
  }

  static setCache = (type: string, schemaPath: string, data: any) => {
    _.set(Cache.cache, `${type}.${schemaPath}`, data);
  };

  static getCache(type: string, schemaPath: string) {
    return _.get(Cache.cache, `${type}.${schemaPath}`);
  }

  static setDataSchema(path: string, data: any) {
    Cache.setCache("dataSchema", path, data);
  }

  static setData(path: string, data: any) {
    Cache.setCache("data", path, data);
  }

  static setLayoutSchema(path: string, data: any) {
    Cache.setCache("layoutSchema", path, data);
  }

  static getDataSchema(path: string) {
    return Cache.getCache("dataSchema", path);
  }

  static getData(path: string) {
    return Cache.getCache("data", path);
  }

  static getLayoutSchema(path: string) {
    return Cache.getCache("layoutSchema", path);
  }
}
