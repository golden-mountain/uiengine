import { IUINode } from "../UINode";
import { IErrorInfo, IRequestConfig } from "../Request";
import { ReactNode } from "react";

export interface IUIEngineWidgetsConfig {
  messager?: ReactNode;
  componentWrapper?: ReactNode;
  uiengineWrapper?: ReactNode;
}

export interface IUIEngineConfig {
  requestConfig: IRequestConfig;
  widgetConfig?: IUIEngineWidgetsConfig;
  ideMode?: boolean;
}

export interface IUIEngineProps {
  layouts: any;
  config: IUIEngineConfig;
  [anyKey: string]: any;
}

export interface IUIEngineStates {
  nodes: Array<IUINodeRenderer>;
  activeNodeID: string;
  error?: IErrorInfo;
  [anyKey: string]: any;
}
