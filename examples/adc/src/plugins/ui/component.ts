import _ from "lodash";
import { IPluginFunc, IPlugin } from "UIEngine/typings";

const callback: IPluginFunc = (component: any) => {
  return { value: component.state.data };
};

export const propsGet: IPlugin = {
  type: "component.props.get",
  initialize: 100,
  callback,
  name: "props-get"
};
