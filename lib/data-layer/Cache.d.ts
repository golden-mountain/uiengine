import { ICache } from "../../typings/DataNode";
import { IUINode } from "../../typings/UINode";
export default class Cache {
    static cache: ICache;
    static clearCache: (type?: string | undefined, schemaPath?: string | undefined) => void;
    static clearDataCache(path?: string): void;
    static clearDataSchemaCache(path?: string): void;
    static clearLayoutSchemaCache(path?: string): void;
    static clearUINodes(rootName: string, parentId?: string): void;
    static setCache: (type: string, schemaPath: string, data: any, replace?: boolean) => void;
    static getCache(type: string, schemaPath?: string): {};
    static setDataSchema(path: string, data: any): void;
    static setData(rootName: string, path: string, data: any): void;
    static setLayoutSchema(path: string, data: any): void;
    static setUINode(path: string, node: IUINode, replace?: boolean): void;
    static getDataSchema(path?: string): {};
    static getData(rootName: string, path?: string): {};
    static getLayoutSchema(path?: string): {};
    static getUINode(path?: string): {};
}
