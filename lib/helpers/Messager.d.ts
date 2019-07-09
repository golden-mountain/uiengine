import { IMessager } from "../../typings";
export default class Messager implements IMessager {
    static instance: IMessager;
    static getInstance: () => Messager;
    objectStateFuncMap: {};
    sendMessage(schemaID: string, info: any): any;
    setStateFunc(schemaID: string, setState: any): void;
    removeStateFunc(schemaID: string): void;
}
