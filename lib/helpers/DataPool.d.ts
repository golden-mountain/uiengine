import { IDataPool } from "../../typings";
export default class DataPool implements IDataPool {
    static instance: IDataPool;
    static getInstance: () => DataPool;
    data: any;
    errors: any;
    private getRealPath;
    set(data: any, path: string): any;
    get(paths?: any, withKey?: boolean): any;
    clear(path?: string): void;
    merge(fromPath: string, toPath: string, clearFromPath?: boolean): {};
    setError(source: string, error: any): void;
    getError(source: string): any;
    clearError(source: any): void;
}
