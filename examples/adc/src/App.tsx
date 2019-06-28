import React from "react";
import { default as components } from "./components";
import requestConfig from "./config/request";

import { UIEngineRegister, UIEngine } from "UIEngine";
import "./App.css";

UIEngineRegister.registerComponents(components);

const App: React.FC = () => {
  const layoutPath = "schema/slb.virtual-server.json";
  const layouts = [layoutPath];

  return <UIEngine layouts={layouts} reqConfig={requestConfig} />;
};

export default App;
