export interface IDataPool {
  data: object;
  set(data: any, path?: string);
  get(paths?: any, withKey?: boolean);
  clear(path?: string);
}
