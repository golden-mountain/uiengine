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

  getDomainName(id: any) {
    if (id && _.isString(id)) {
      const splitter = id.indexOf(":") > -1 ? ":" : ".";
      let [schemaPath] = id.split(splitter);
      return _.snakeCase(schemaPath);
    } else {
      return "$dummy";
    }
  }

  set(data: any, path?: string) {
    if (path) {
      const domainName = this.getDomainName(path);
      const domainData = _.get(this.data, domainName);
      let p = path.replace("[]", "");
      let d = _.get(domainData, p, path.indexOf("[]") > -1 ? [] : null);
      if (_.isArray(d) && !_.isArray(data)) {
        d.push(data);
        _.set(this.data, p, d);
      } else {
        _.set(this.data, p, data);
      }
    } else {
      _.merge(this.data, data);
    }
    return this.data;
  }

  get(paths?: any, withKey: boolean = true) {
    let results: any = [];
    if (_.isArray(paths) && paths.length) {
      results = paths.map(path => {
        const domainName = this.getDomainName(path);
        let p = `${domainName}.${path}`;
        let result = _.get(this.data, path);
        if (withKey) {
          return _.set({}, path, result);
        }
        return result;
      });
    } else {
      if (_.isString(paths)) {
        const domainName = this.getDomainName(paths);
        let p = `${domainName}.${paths}`;
        results = _.get(this.data, paths);
      } else {
        results = this.data;
      }
    }
    return results;
  }

  clear(path?: string) {
    if (path) {
      const domainName = this.getDomainName(path);
      let p = `${domainName}.${path}`;
      _.unset(this.data, path);
    } else {
      this.data = {};
    }
  }
}
