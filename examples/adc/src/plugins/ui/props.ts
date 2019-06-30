import _ from "lodash";
import { Event } from "UIEngine";
import { IPluginFunc, IPlugin, IUINode } from "UIEngine/typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  const schema = uiNode.getSchema();
  const props = _.get(schema, "props");
  // load label & type from data schema
  const dataLabel: string = uiNode.dataNode.getSchema("label");
  const inputType: string = uiNode.dataNode.getSchema("type");

  // get data value
  const value = uiNode.dataNode.getData();

  let result = { key: uiNode.id, label: dataLabel, type: inputType, value };
  if (props) {
    let {
      $events,
      label = dataLabel,
      type = inputType,
      ...rest
    } = props as any;
    let eventFuncs = {};

    // load event and default event
    if (!$events) {
      $events = [
        {
          event: "onChange",
          action: "change"
        }
      ];
    }
    const event = new Event(uiNode);
    eventFuncs = await event.loadEvents($events);

    // assign props to uiNode
    result = { ...rest, ...eventFuncs, ...result, label, type };
  }
  uiNode.props = result;
  return result;
};

export const props: IPlugin = {
  type: "ui.parser",
  initialize: 100,
  callback,
  name: "props-parser"
};
