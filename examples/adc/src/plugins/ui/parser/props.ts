import _ from "lodash";
import { Event } from "UIEngine";
import { IPluginFunc, IPlugin, IUINode } from "UIEngine/typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  const schema = uiNode.getSchema();
  const props: any = _.get(schema, "props", {});
  // load label & type from data schema
  const dataLabel: string = uiNode.dataNode.getSchema("label");
  const inputType: string = uiNode.dataNode.getSchema("type");

  // get data value
  const value = uiNode.dataNode.getData();

  // load event and default event
  let $events: any = props.$events || [];
  if (!props.$events) {
    $events = [
      {
        event: "onChange",
        action: "change"
      }
    ];
  }
  const event = new Event(uiNode);
  let eventFuncs = await event.loadEvents($events);

  // get error validation info
  const errorInfo = uiNode.dataNode.errorInfo;

  // assign all default props
  let result = {
    key: uiNode.id,
    label: dataLabel,
    type: inputType,
    value,
    errorInfo,
    ...eventFuncs
  };

  // assign user defined props;
  if (props) {
    let {
      label = dataLabel,
      type = inputType,
      $events,
      ...rest
    } = props as any;

    // assign props to uiNode
    result = { ...rest, ...result, label, type };
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
