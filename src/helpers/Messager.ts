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

  sendMessage(schemaID: string, info: any) {
    const setState = this.objectStateFuncMap[schemaID];
    if (_.isFunction(setState)) {
      try {
        return setState(info);
      } catch (e) {
        console.log(e.message);
      }
    } else {
      console.error("schema id", schemaID, "not found setstate");
      return false;
    }
  }

  setStateFunc(schemaID: string, setState: any) {
    if (_.isFunction(setState)) {
      console.log(">>>>schema id ", schemaID, " is setting schema id");
      this.objectStateFuncMap[schemaID] = setState;
    }
  }

  removeStateFunc(schemaID: string) {
    console.log("", schemaID, " is removing setstate");
    _.unset(this.objectStateFuncMap, schemaID);
  }
}
