import _ from "lodash";
import { Event } from "../../data-layer";
import { IPluginFunc, IPlugin, IUINode, ILayoutSchema } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  const schema = uiNode.getSchema();
  const props = _.get(schema, "props");
  let result = { key: uiNode.id };
  if (props) {
    const { $events, ...rest } = props as any;
    let eventFuncs = {};
    if ($events) {
      const event = new Event();
      // const eventSchemas = _.get(props, "events");
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
  initialize: false,
  callback,
  name: "props-parser"
};
