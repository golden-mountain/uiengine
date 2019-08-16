import React from "react";

import { Route } from "react-router-dom";

import config from "../../config";
import { UIEngine, Workflow } from "uiengine";

export const Router: React.FC = (props: any) => {
  const { path, layouts, ...routeProps } = props;
  const EngineComponent = () => {
    return <UIEngine layouts={layouts} config={config} key={path} />;
  };
  return <Route {...routeProps} path={path} component={EngineComponent} />;
};
