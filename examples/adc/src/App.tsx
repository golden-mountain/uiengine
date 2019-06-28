import React from "react";
import { default as components } from "./components";
import * as plugins from "./plugins";
import requestConfig from "./config/request";

import { UIEngineRegister, UIEngine } from "UIEngine";
import "./App.css";

UIEngineRegister.registerComponents(components);
UIEngineRegister.registerPlugins(plugins);

const App: React.FC = () => {
  const layoutPath = "schema/ui/slb.virtual-server.json";
  const layouts = [layoutPath];

  return <UIEngine layouts={layouts} reqConfig={requestConfig} />;
};

export default App;
