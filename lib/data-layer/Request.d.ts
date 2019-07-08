import { IRequest, IRequestConfig } from "../../typings";
export default class Request implements IRequest {
    static instance: IRequest;
    static getInstance: (config?: IRequestConfig | undefined) => Request;
    private req;
    config: IRequestConfig | any;
    constructor(config?: IRequestConfig);
    get(url: string, params?: any): any;
    put(url: string, params?: any): any;
    post(url: string, params?: any): any;
    delete(url: string, params?: any): any;
    getConfig(configName?: string): any;
    setConfig(config: any, configName?: string): void;
}
