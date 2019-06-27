import _ from "lodash";
import { IComponentState, IUINode, IMessager } from "../../typings";

export default class Messager implements IMessager {
  static objectStateFuncMap = {
    // [id]: setState
  };
  private componentState: IComponentState = {};

  constructor(schemaID?: string) {
    // console.log("registered a messager", schemaID);
    // if (schemaID) {
    //   Messager.objectStateFuncMap[schemaID] = () => {
    //     console.log("No setState func attached");
    //   };
    // }
  }

  sendMessage(schemaID: string, info: any) {
    _.merge(this.componentState, info);

    const setState = Messager.objectStateFuncMap[schemaID];
    if (_.isFunction(setState)) {
      return setState(this.componentState);
    } else {
      return false;
    }
  }

  setStateFunc(schemaID: string, setState: any) {
    if (_.isFunction(setState)) {
      Messager.objectStateFuncMap[schemaID] = setState;
    }
  }

  removeStateFunc(schemaID: string) {
    _.unset(Messager.objectStateFuncMap, schemaID);
  }
}
