import axios from "axios";
import MockAdapter from "axios-mock-adapter";
// Add a request interceptor
// axios.interceptors.request.use(
//   function(config) {
//     // Do something before request is sent
//     return config;
//   },
//   function(error) {
//     // Do something with request error
//     return Promise.reject(error);
//   }
// );

// // Add a response interceptor
// axios.interceptors.response.use(
//   function(response) {
//     // Do something with response data
//     return response;
//   },
//   function(error) {
//     // Do something with response error
//     return Promise.reject(error);
//   }
// );

class RequestAbstract {
  axios: any;
  config: any;

  constructor(config: any) {
    this.config = config;
    this.axios = axios.create(config);
  }

  // request(requestConfig: any) {
  //   try {
  //     const response = this.axios.request(requestConfig);
  //     console.log(response);
  //     return response;
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  get(url: string, params?: any) {
    return this.axios.get(url, params);
  }

  put(url: string, params?: any) {
    return this.axios.put(url, params);
  }

  post(url: string, params?: any) {
    return this.axios.post(url, params);
  }

  delete(url: string, params?: any) {
    return this.axios.delete(url, params);
  }
}

class RequestDev extends RequestAbstract {
  private pathPrefix: string = "";
  private mock: any;

  constructor(config: any) {
    super(config);
    this.pathPrefix = config.pathPrefix;
    this.mock = new MockAdapter(this.axios);
  }

  private mockRequest(url: string, parmas: any, method: string = "Get") {
    const path: string = `${this.pathPrefix}/${url}`;
    const data = require(path);
    // console.log(path, data);
    const methodName = `on${method}`;
    this.mock[methodName](url, parmas).reply(200, data);
  }

  get(url: string, params?: any) {
    this.mockRequest(url, params);
    return this.axios.get(url, params);
  }

  put(url: string, params?: any) {
    this.mockRequest(url, params);
    return this.axios.put(url, params);
  }

  post(url: string, params?: any) {
    this.mockRequest(url, params);
    return this.axios.post(url, params);
  }

  delete(url: string, params?: any) {
    this.mockRequest(url, params);
    return this.axios.delete(url, params);
  }
}

class RequestProduct extends RequestAbstract {
  // constructor(config: object) {
  // }
}

export default class Request implements IRequest {
  private req: any;

  constructor(config?: IRequestConfig) {
    if (config && config.devMode) {
      this.req = new RequestDev(config);
    } else {
      this.req = new RequestProduct(config);
    }
  }

  get(url: string, params?: any) {
    return this.req.get(url, params);
  }

  put(url: string, params?: any) {
    return this.req.put(url, params);
  }

  post(url: string, params?: any) {
    return this.req.post(url, params);
  }

  delete(url: string, params?: any) {
    return this.req.delete(url, params);
  }
}
