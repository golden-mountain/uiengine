import _ from "lodash";
import { formatSource, getDomainName } from "../";
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
  errors: any = {};

  set(data: any, path: string) {
    const domainName = getDomainName(path);
    const domainData = _.get(this.data, domainName);
    path = formatSource(path);
    let p = path.replace("[]", "");
    let d = _.get(domainData, p, path.indexOf("[]") > -1 ? [] : null);

    p = `${domainName}.${p}`;
    if (_.isArray(d) && !_.isArray(data)) {
      d.push(data);
      _.set(this.data, p, d);
    } else {
      _.set(this.data, p, data);
    }

    return this.data;
  }

  get(paths?: any, withKey: boolean = true) {
    let results: any = [];
    if (_.isArray(paths) && paths.length) {
      results = paths.map(path => {
        const domainName = getDomainName(path);
        path = formatSource(path);
        let p = `${domainName}.${path}`;
        let result = _.get(this.data, p);
        if (withKey) {
          return _.set({}, p, result);
        }
        return result;
      });
    } else {
      if (_.isString(paths)) {
        const domainName = getDomainName(paths);
        paths = formatSource(paths);
        let p = `${domainName}.${paths}`;
        results = _.get(this.data, p);
      } else {
        results = this.data;
      }
    }
    return results;
  }

  clear(path?: string) {
    if (path) {
      const domainName = getDomainName(path);
      path = formatSource(path);
      let p = `${domainName}.${path}`;
      _.unset(this.data, p);
    } else {
      this.data = {};
    }
  }

  setError(source: string, error: any) {
    this.errors[source] = error;
  }

  clearError(source: any) {
    _.unset(this.errors, source);
  }
}
