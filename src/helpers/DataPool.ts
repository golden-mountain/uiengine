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

  private getRealPath(source: string) {
    const domainName = getDomainName(source);
    let path = formatSource(source);
    let p = `${domainName}.${path}`;
    return p;
  }

  set(data: any, path: string) {
    const domainName = getDomainName(path);
    const domainData = _.get(this.data, domainName);
    path = formatSource(path);
    let p = path.replace("[]", "");
    let d = _.get(domainData, p, path.indexOf("[]") > -1 ? [] : null);
    p = `${domainName}.${p}`;
    if (_.isArray(d)) {
      if (!_.isArray(data)) {
        d.push(data);
      } else {
        // compare with the data is equal, if equal, then ignore it
        d = _.unionWith(d, data, _.isEqual);
      }
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
          return _.set({}, path, result);
        }
        return result;
      });
    } else {
      if (_.isString(paths)) {
        const domainName = getDomainName(paths);
        paths = formatSource(paths);
        let p = `${domainName}.${paths}`;
        results = _.get(this.data, p);
        if (withKey) {
          return _.set({}, paths, results);
        }
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
      const pathObject = _.toPath(p);

      if (!isNaN(Number(_.last(pathObject)))) {
        const rmIndex = pathObject.pop();
        const parentObj = _.get(this.data, pathObject, []);
        parentObj.splice(rmIndex, 1);
        _.set(this.data, pathObject, parentObj);
      } else {
        _.unset(this.data, p);
      }
    } else {
      this.data = {};
    }
  }

  merge(fromPath: string, toPath: string, clearFromPath: boolean = false) {
    let result = {};
    result = this.get(fromPath, false);
    if (!_.isEmpty(result)) {
      this.set(result, toPath);
      if (clearFromPath) this.clear(fromPath);
    }
    return result;
  }

  setError(source: string, error: any) {
    const path = this.getRealPath(source);
    _.set(this.errors, path, error);
  }

  getError(source: string) {
    const path = this.getRealPath(source);
    return _.get(this.errors, path);
  }

  clearError(source: any) {
    const path = this.getRealPath(source);
    _.unset(this.errors, path);
  }
}
