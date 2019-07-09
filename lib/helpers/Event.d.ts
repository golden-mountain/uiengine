import { IPluginManager, IEvent, IUINode } from "../../typings";
export default class Event implements IEvent {
    pluginManager: IPluginManager;
    constructor(caller: IUINode);
    loadEvents(events: Array<any>): Promise<any>;
}
