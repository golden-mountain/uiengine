import { IDataPool } from "../../typings";
export default class DataPool implements IDataPool {
    static instance: IDataPool;
    static getInstance: () => DataPool;
    data: any;
    set(data: any, path: string): any;
    get(paths?: any, withKey?: boolean): any;
    clear(path?: string): void;
}
