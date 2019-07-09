import { IRequest, IRequestConfig } from "../../typings";
export default class Request implements IRequest {
    static instance: IRequest;
    static getInstance: () => Request;
    private req;
    config: IRequestConfig | any;
    setConfig(config?: IRequestConfig): void;
    get(url: string, params?: any): any;
    put(url: string, params?: any): any;
    post(url: string, params?: any): any;
    delete(url: string, params?: any): any;
    getConfig(configName?: string): any;
}
