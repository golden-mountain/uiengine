import _ from "lodash";
import { IMessager } from "../../typings";

export default class Messager implements IMessager {
  static instance: IMessager;
  static getInstance = () => {
    if (!Messager.instance) {
      Messager.instance = new Messager();
    }
    return Messager.instance as Messager;
  };

  objectStateFuncMap = {
    // [id]: setState
  };

  sendMessage(id: string, info: any) {
    const setState = this.objectStateFuncMap[id];
    if (_.isFunction(setState)) {
      try {
        return setState(info);
      } catch (e) {
        console.log(e.message);
      }
    } else {
      return false;
    }
  }

  setStateFunc(id: string, setState: any) {
    if (_.isFunction(setState)) {
      this.objectStateFuncMap[id] = setState;
    }
  }

  removeStateFunc(id: string) {
    _.unset(this.objectStateFuncMap, id);
  }
}
