import { IDataPool } from "../../typings";
export default class DataPool implements IDataPool {
    static instance: IDataPool;
    static getInstance: () => DataPool;
    data: any;
    errors: any;
    set(data: any, path: string): any;
    get(paths?: any, withKey?: boolean): any;
    clear(path?: string): void;
    setError(source: string, error: any): void;
    clearError(source: any): void;
}
