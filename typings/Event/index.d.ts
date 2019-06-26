export interface IEvent {
  pluginManager: IPluginManager;
  loadEvents(events: Array<any>);
}
