interface IRequest {
  get(url: string, params?: any);
  put(url: string, params?: any);
  post(url: string, params?: any);
  delete(url: string, params?: any);
}

interface IRequestConfig extends AxiosRequestConfig {
  devMode?: boolean;
  pathPrefix?: string;
}

interface IErrorInfo {
  status?: number;
  code?: any;
}
