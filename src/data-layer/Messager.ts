import _ from "lodash";
import { IMessager } from "../../typings";

export default class Messager implements IMessager {
  static objectStateFuncMap = {
    // [id]: setState
  };

  sendMessage(schemaID: string, info: any) {
    const setState = Messager.objectStateFuncMap[schemaID];
    if (_.isFunction(setState)) {
      return setState(info);
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
