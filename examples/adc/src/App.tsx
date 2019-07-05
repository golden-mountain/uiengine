import React, { useState } from "react";
import { BrowserRouter, Link } from "react-router-dom";
import { Menu, Icon } from "antd";

import { default as components } from "./components";
import * as plugins from "./plugins";
import requestConfig from "./config/request";
import { UIEngineRegister, UIEngine } from "UIEngine";
import "./App.css";

UIEngineRegister.registerComponents(components);
UIEngineRegister.registerPlugins(plugins);

const App: React.FC = () => {
  const [current, setCurrent] = useState();
  const handleClick = (e: any) => {
    setCurrent(e.key);
  };
  return (
    <BrowserRouter>
      <Menu onClick={handleClick} selectedKeys={[current]} mode="horizontal">
        <Menu.Item key="virtual-server">
          <Link to="/virtual-server">Virtual Server</Link>
        </Menu.Item>
        <Menu.Item key="wizard">
          <Link to="/wizard">Wizard</Link>
        </Menu.Item>
        <Menu.Item key="ssl-client">
          <Link to="/ssl-client">SSL Client Template</Link>
        </Menu.Item>
      </Menu>
      <UIEngine layouts={["schema/ui/app.json"]} reqConfig={requestConfig} />
    </BrowserRouter>
  );
};

export default App;
