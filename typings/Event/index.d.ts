import { IUINode } from "../UINode"

export interface IEvent {
  uiNode: IUINode
  pluginManager: IPluginManager;
  loadEvents(events: Array<any>);
}
