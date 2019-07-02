import _ from "lodash";
import { IDataPool } from "../../typings";

export default class DataPool implements IDataPool {
  static instance: IDataPool;
  static getInstance = () => {
    if (!DataPool.instance) {
      DataPool.instance = new DataPool();
    }
    return DataPool.instance as DataPool;
  };

  data: any = {};

  set(data: any, path?: string) {
    if (path) {
      _.set(this.data, path, data);
    } else {
      _.merge(this.data, data);
    }
    return this.data;
  }

  get(paths?: Array<string>, withKey: boolean = true) {
    let results = [];
    if (paths) {
      results = paths.map(path => {
        let result = _.get(this.data, path);
        if (withKey) {
          return _.set({}, path, result);
        }
        return result;
      });
    } else {
      results.push(this.data);
    }
    return results;
  }

  clear(path?: string) {
    if (path) {
      _.unset(this.data, path);
    } else {
      this.data = {};
    }
  }
}
