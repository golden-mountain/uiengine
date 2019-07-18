import { IUINode, IStateNode, IState } from "../../../typings";
export declare function setComponentState(this: any, state: any): any;
export declare function compareDataLogic(expected: any, actual: any, strategy?: string, rule?: string): boolean;
export declare function compareStateLogic(expected: IState, actual: IState, strategy?: string, rule?: string): boolean;
export declare function stateCompare(target: IUINode, deps: any, name: string, strategy?: string, rule?: string): boolean;
export declare function dataCompare(target: IUINode, expected: any, strategy?: string, rule?: string): boolean;
export declare function stateDepsResolver(stateNode: IStateNode, stateName: string): boolean;
