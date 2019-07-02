import { IDataMapper, IDataSchema, IRequest, IErrorInfo, IPluginManager } from "../../typings";
export default class DataMapper implements IDataMapper {
    private request;
    errorInfo?: IErrorInfo;
    source: string;
    rootSchema?: IDataSchema;
    pluginManager: IPluginManager;
    cacheID: string;
    constructor(request: IRequest);
    getDataEntryPoint(method: string): string;
    loadSchema(source: string): Promise<any>;
}
