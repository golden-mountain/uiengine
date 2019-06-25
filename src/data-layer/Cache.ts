import { ICache } from "../../typings/DataNode";
import _ from "lodash";
import { IUINode } from "../../typings/UINode";

export default class Cache {
  static cache: ICache = {
    dataSchema: {},
    data: {},
    layoutSchema: {},
    uiNodes: {}
  };

  // static schema: ICache = {};
  static clearCache = (type: string, schemaPath?: string) => {
    if (schemaPath) {
      _.unset(Cache.cache, `${type}.${schemaPath}`);
      //   Cache.cache[type][schemaPath] = {};
    } else if (type) {
      _.unset(Cache.cache, type);
    } else {
      Cache.cache = {};
    }
  };

  static clearDataCache(path?: string) {
    if (path) {
      Cache.clearCache("data", path);
    } else {
      Cache.clearCache("data");
    }
  }

  static clearDataSchemaCache(path?: string) {
    if (path) {
      Cache.clearCache("dataSchema", path);
    } else {
      Cache.clearCache("dataSchema");
    }
  }

  static clearLayoutSchemaCache(path?: string) {
    if (path) {
      Cache.clearCache("layoutSchema", path);
    } else {
      Cache.clearCache("layoutSchema");
    }
  }

  static clearUINodes(obj: IUINode) {
    Cache.clearCache("uiNodes", obj.id);
  }

  static setCache = (
    type: string,
    schemaPath: string,
    data: any,
    replace: boolean = true
  ) => {
    let path = schemaPath.replace(".", "-");
    if (replace) {
      _.set(Cache.cache, `${type}.${path}`, data);
    } else {
      const cache = Cache.getCache(type, schemaPath);
      if (!cache) {
        _.set(Cache.cache, `${type}.${path}`, data);
      }
    }
  };

  static getCache(type: string, schemaPath?: string) {
    if (schemaPath) {
      let path = schemaPath.replace(".", "-");
      return _.get(Cache.cache, `${type}.${path}`);
    } else {
      return _.get(Cache.cache, type);
    }
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

  static setUINode(path: string, node: IUINode, replace: boolean = false) {
    let currentCache = Cache.getCache("uiNodes", path);
    if (currentCache) {
      currentCache[node.id] = node;
    } else {
      currentCache = {
        [node.id]: node
      };
    }
    Cache.setCache("uiNodes", path, currentCache, replace);
  }

  static getDataSchema(path?: string) {
    return Cache.getCache("dataSchema", path);
  }

  static getData(path?: string) {
    return Cache.getCache("data", path);
  }

  static getLayoutSchema(path?: string) {
    return Cache.getCache("layoutSchema", path);
  }

  static getUINode(path?: string) {
    return Cache.getCache("uiNodes", path);
  }
}
