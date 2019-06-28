import { IRequest, IRequestConfig } from "../../typings";
export default class Request implements IRequest {
    private req;
    private config;
    constructor(config?: IRequestConfig);
    get(url: string, params?: any): any;
    put(url: string, params?: any): any;
    post(url: string, params?: any): any;
    delete(url: string, params?: any): any;
    getConfig(configName?: string): any;
}
