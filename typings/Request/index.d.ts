export interface IRequest {
  get(url: string, params?: any);
  put(url: string, params?: any);
  post(url: string, params?: any);
  delete(url: string, params?: any);
  getConfig(configName?: string);
}

export interface IRequestConfig extends AxiosRequestConfig {
  devMode?: boolean;
  pathPrefix?: string;
  dataSchemaPrefix?: string;
  mockDataPrefix?: string;
  layoutSchemaPrefix?: string;
}

export interface IErrorInfo {
  status?: number;
  code?: any;
}
