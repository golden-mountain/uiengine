import {
  IState,
  IStateNode,
  StatePluginFunc
} from "../../../typings/StateNode";

export function visible(this: IStateNode) {
  const schema = this.getUINode().getSchema();
  return true;
}
