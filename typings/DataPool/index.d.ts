export interface IDataPool {
  data: object;
  set(data: any, path?: string);
  get(paths?: Array<string>, withKey?: boolean);
  clear(path?: string);
}
