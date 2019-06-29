import _ from "lodash";

import { PluginManager } from "./";

import { IPluginManager, IEvent, IUINode } from "../../typings";

export default class Event implements IEvent {
  pluginManager: IPluginManager;

  constructor(caller: IUINode) {
    this.pluginManager = new PluginManager(caller);
  }

  async loadEvents(events: Array<any>) {
    const eventPlugins = await this.pluginManager.executePlugins(
      "ui.parser.event"
    );

    const eventsBinded: any = {};
    events.forEach((v: any) => {
      const { action, event, ...schemaOptions } = v;
      if (action && _.has(eventPlugins, action)) {
        eventsBinded[event] = function(this: any, e: any) {
          const callback = _.get(eventPlugins, action);
          try {
            return callback.call(this, e, schemaOptions);
          } catch (e) {
            console.log("Event call error:", e.message);
          }
        };
      }
    });
    return eventsBinded;
  }
}
