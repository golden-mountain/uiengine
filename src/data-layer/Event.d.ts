import { IPluginManager, IEvent } from "../../typings";
export default class Event implements IEvent {
    pluginManager: IPluginManager;
    constructor(loadDefaultPlugins?: boolean);
    loadEvents(events: Array<any>): Promise<any>;
}
