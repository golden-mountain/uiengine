import _ from "lodash";

export default class Messager {
  caller: any = () => {
    console.error("please use messager.setStateFunc on each node");
  };

  sendMessage: any = (...args: any) => {
    return this.caller.apply(this, args);
  };

  setStateFunc(setState: any) {
    if (_.isFunction(setState)) {
      this.caller = setState;
    }
  }

  removeStateFunc() {
    this.caller = null;
  }
}
