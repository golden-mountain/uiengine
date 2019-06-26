import _ from "lodash";
import { Event } from "../..";
import { IPluginFunc, IPlugin, IUINode, ILayoutSchema } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  const schema = uiNode.getSchema();
  const props = _.get(schema, "props");
  let result = {};
  if (props) {
    let events = {};
    if (_.has(props, "events")) {
      const event = new Event();
      const eventSchemas = _.get(props, "events");
      events = await event.loadEvents(eventSchemas);
    }

    // assign props to uiNode
    uiNode.props = { ...props, ...events };
  }
  return result;
};

export const props: IPlugin = {
  type: "ui.parser",
  initialize: false,
  callback,
  name: "props-parser"
};
