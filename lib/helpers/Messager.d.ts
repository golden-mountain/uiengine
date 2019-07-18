import { IMessager } from "../../typings";
export default class Messager implements IMessager {
    static instance: IMessager;
    static getInstance: () => Messager;
    objectStateFuncMap: {};
    sendMessage(id: string, info: any): any;
    setStateFunc(id: string, setState: any): void;
    removeStateFunc(id: string): void;
}
