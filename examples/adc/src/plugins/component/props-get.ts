// import _ from "lodash";
import { IPluginFunc, IPlugin } from "UIEngine/typings";

const callback: IPluginFunc = (component: any) => {
  // TO FIX, when add and delete row, the state did not update in time using setState on messager
  return { value: component.props.uiNode.dataNode.data };
  // return { value: component.state.data };
};

export const propsGet: IPlugin = {
  type: "component.props.get",
  priority: 100,
  callback,
  name: "props-get"
};
