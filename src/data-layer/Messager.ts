import _ from "lodash";
import { IComponentState } from "../../typings";

export default class Messager {
  private componentState: IComponentState = {};
  private context: any;

  caller: any = () => {
    console.error("Messager: please use messager.setStateFunc on each node");
  };

  sendMessage: any = (...args: any) => {
    args.forEach((arg: any) => {
      _.merge(this.componentState, arg);
    });

    // console.log(this.caller);
    return this.caller.apply(this.context, this.componentState);
  };

  setStateFunc(setState: any, context?: any) {
    // console.log("state func was set on messager");
    if (_.isFunction(setState)) {
      this.caller = setState;
    }

    if (context) {
      this.context = context;
    }
  }

  removeStateFunc() {
    this.caller = null;
  }
}
