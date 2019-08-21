import _ from "lodash";
import { Event } from "../../helpers";
import { IPluginFunc, IPlugin, IUINode } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  const schema = uiNode.getSchema();
  const props = _.get(schema, "props");
  let result = { key: uiNode.id };
  if (props) {
    const { $events, ...rest } = props as any;
    let eventFuncs = {};
    if ($events) {
      const event = new Event(uiNode);
      eventFuncs = await event.loadEvents($events);
    }

    // assign props to uiNode
    result = { ...rest, ...eventFuncs, ...result };
  }
  uiNode.props = result;
  return result;
};

export const props: IPlugin = {
  type: "ui.parser",
  priority: 0,
  callback,
  name: "props-parser"
};
