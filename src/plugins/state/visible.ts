import _ from "lodash";
import { IStateNode } from "../../../typings/StateNode";
import { stateDepsResolver } from "../state-helper";
import { IPluginFunc, IPlugin } from "../../../typings";

const callback: IPluginFunc = (stateNode: IStateNode) => {
  return stateDepsResolver(stateNode, "visible");
};

export const visible: IPlugin = {
  type: "state",
  initialize: false,
  callback,
  name: "visible"
};
