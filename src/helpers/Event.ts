import _ from "lodash";

import { PluginManager } from ".";

import { IPluginManager, IEvent, IUINode } from "../../typings";

export default class Event implements IEvent {
  uiNode: IUINode
  pluginManager: IPluginManager;

  constructor(caller: IUINode) {
    this.uiNode = caller
    this.pluginManager = PluginManager.getInstance()
  }

  async loadEvents(events: Array<any>) {
    const exeResult = await this.pluginManager.executePlugins(
      this.uiNode.id,
      'ui.parser.event',
      { uiNode: this.uiNode }
    );
    const eventPlugins: { [key: string]: (e: any, o: any) => {} } = exeResult.results.reduce((map, result) => {
      if (_.isFunction(result.result)) {
        map[result.name] = result.result
      }
      return map
    }, {})
    const eventsBinded: any = {};
    events.forEach((v: any) => {
      const { action, event, options } = v;
      if (action && _.has(eventPlugins, action)) {
        eventsBinded[event] = function(this: any, e: any) {
          const callback = _.get(eventPlugins, action);
          try {
            return callback.call(this, e, options);
          } catch (e) {
            console.log("Event call error:", e.message);
          }
        };
      }
    });
    return eventsBinded;
  }
}
