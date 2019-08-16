import React, { useState } from "react";
import _ from "lodash";
import { BrowserRouter } from "react-router-dom";
import { PageHeader, Button, Menu } from "antd";
import { Link } from "react-router-dom";

import { default as components } from "./components";
import * as plugins from "./plugins";
import { requestConfig, widgetConfig } from "./config";
import {
  UIEngineRegister,
  UIEngine,
  submitToAPI,
  NodeController
} from "uiengine";
import "./App.css";

UIEngineRegister.registerComponents(components);
UIEngineRegister.registerPlugins(plugins);

const App: React.FC = () => {
  const [current, setCurrent] = useState();

  let loginLayout = "schema/ui/login.json";

  const handleClick = (e: any) => {
    setCurrent(e.key);
  };

  const showLogin = () => {
    // setVisible(true);
    const nodeController = NodeController.getInstance();
    const loadOptions = {
      container: "antd:Modal",
      title: "Login",
      visible: true,
      onOk: handleOK,
      onCancel: handleCancel
    };
    nodeController.workflow.activeLayout(loginLayout, loadOptions);
  };

  const headers: any = requestConfig.headers;
  const handleOK = () => {
    // const uiNode = controller.getUINode(loginLayout);
    const result = submitToAPI([{ source: "credentials" }]);
    result.then((res: any) => {
      const token = _.get(res[0], "credentials.authresponse.signature");

      if (token) {
        sessionStorage.setItem("token", token);
        headers["Authorization"] = `A10 ${token}`;
      }

      console.log(sessionStorage.getItem("token"), " token fetched");
      const nodeController = NodeController.getInstance();
      nodeController.hideUINode(loginLayout);
    });
  };

  const handleCancel = () => {
    const nodeController = NodeController.getInstance();
    nodeController.hideUINode(loginLayout);
  };

  const token = sessionStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `A10 ${token}`;
  }

  return (
    <BrowserRouter>
      <PageHeader
        onBack={() => null}
        title="uiengine Examples"
        subTitle=" Demo Box"
        extra={[
          <Button key="1" onClick={showLogin}>
            Login
          </Button>
        ]}
      />

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

      <UIEngine
        layouts={["schema/ui/app.json"]}
        config={{ requestConfig, widgetConfig }}
      />
    </BrowserRouter>
  );
};

export default App;
