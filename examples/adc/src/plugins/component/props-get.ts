import _ from "lodash";

import { IPlugin, IPluginExecution, IPluginParam } from "uiengine/typings";
import { props } from "../ui";

const execution: IPluginExecution = (param: IPluginParam) => {
  const value: any = _.get(param, "component.props.uiNode.dataNode.data");
  const props = _.get(param, "props");
  props.value = value;
  // TO FIX, when add and delete row, the state did not update in time using setState on messager
  //return { value }
  // return { value: component.state.data }
};

export const propsGet: IPlugin = {
  name: "props-get",
  categories: ["component.props.get"],
  paramKeys: ["component", "props"],
  priority: 100,
  execution
};
