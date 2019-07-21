import React from "react";

import { Route } from "react-router-dom";

import requestConfig from "../../config/request";
import { UIEngine, Workflow } from "UIEngine";

export const Router: React.FC = (props: any) => {
  const { path, layouts, ...routeProps } = props;
  const EngineComponent = () => {
    return <UIEngine layouts={layouts} reqConfig={requestConfig} key={path} />;
  };
  return <Route {...routeProps} path={path} component={EngineComponent} />;
};
