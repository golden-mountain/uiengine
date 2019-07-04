export interface IDataPool {
  data: object;
  errors: any = [];
  set(data: any, path?: string);
  get(paths?: any, withKey?: boolean);
  clear(path?: string);
  setError(field: string, error: any);
  clearError(source: any);
}
