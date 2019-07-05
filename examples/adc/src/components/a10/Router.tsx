import React from "react";

import { Route } from "react-router-dom";

import requestConfig from "../../config/request";
import { UIEngine } from "UIEngine";

export const Router: React.FC = (props: any) => {
  const { path, layouts, ...routeProps } = props;
  const EngineComponent = () => {
    console.log(path, layouts);
    return <UIEngine layouts={layouts} reqConfig={requestConfig} />;
  };
  return <Route {...routeProps} path={path} component={EngineComponent} />;
};
