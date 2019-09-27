import { INodeProps } from "../UINode";

export interface IConnectOptions {
  source: string; // from data source like a.b.c
  target: string; // target data source like foo.bar
  options?: {
    clearSource: boolean;
    [name: string]: any;
  };
  targetSelector?: INodeProps;
}

export interface IDataPool {
  data: object;
  errors: any = [];
  set(data: any, path?: string);
  get(paths?: any, withKey?: boolean);
  merge(fromPath: string, toPath: string, clearFromPath: boolean = false);
  setStatus(path: string, status: string);
  getStatus(path: string);
  clear(path?: string);
  setError(field: string, error: any);
  getError(source: string);
  clearError(source: any);
}
