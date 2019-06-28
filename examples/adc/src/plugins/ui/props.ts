import _ from "lodash";
import { Event } from "UIEngine";
import { IPluginFunc, IPlugin, IUINode } from "UIEngine/typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  const schema = uiNode.getSchema();
  const props = _.get(schema, "props");
  const dataLabel: string = uiNode.dataNode.getSchema("label");
  const inputType: string = uiNode.dataNode.getSchema("type");

  let result = { key: uiNode.id, label: dataLabel, type: inputType };
  if (props) {
    let {
      $events,
      label = dataLabel,
      type = inputType,
      ...rest
    } = props as any;
    let eventFuncs = {};
    if ($events) {
      const event = new Event();
      eventFuncs = await event.loadEvents($events);
    }
    // assign props to uiNode
    result = { ...rest, ...eventFuncs, ...result, label, type };
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
