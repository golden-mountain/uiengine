declare interface IRequest {
  get: (url: string, params: any) => any;
  put: (url: string, params: any) => any;
  post: (url: string, params: any) => any;
  delete: (url: string, params: any) => any;
}
