import { IMessager } from "../../typings";
export default class Messager implements IMessager {
    static objectStateFuncMap: {};
    private componentState;
    constructor(schemaID?: string);
    sendMessage(schemaID: string, info: any): any;
    setStateFunc(schemaID: string, setState: any): void;
    removeStateFunc(schemaID: string): void;
}
