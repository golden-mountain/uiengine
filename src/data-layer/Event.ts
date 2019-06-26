import _ from "lodash";

import { PluginManager } from "./";

import * as eventPlugins from "../plugins/events";
import { IPluginManager, IEvent } from "../../typings";

export default class Event implements IEvent {
  pluginManager: IPluginManager = new PluginManager(this);

  constructor(loadDefaultPlugins: boolean = true) {
    if (loadDefaultPlugins) {
      this.pluginManager.loadPlugins(eventPlugins);
    }
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
          return callback.call(this, e, schemaOptions);
        };
      }
    });
    return eventsBinded;
  }
}
