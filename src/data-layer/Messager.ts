import { ISetStateFunc } from "../../typings";

export default class Messager {
  setState: any = () => {};

  setStateFunc(setState: any) {
    this.setState = setState;
  }
}
