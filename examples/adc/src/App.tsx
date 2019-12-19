import React, { useState, useEffect } from "react";
import _ from "lodash";
import { BrowserRouter } from "react-router-dom";
import { PageHeader, Button, Menu } from "antd";
import { Link } from "react-router-dom";

import { default as components } from "./components";
import * as plugins from "./plugins";
import * as handlers from "./handlers";
import { requestConfig, widgetConfig } from "./config";
import {
  Request,
  UIEngineRegister,
  UIEngine,
  submitToAPI,
  NodeController
} from "uiengine";
import "./App.css";
import { useMemo } from "react";

UIEngineRegister.registerComponents(components);
UIEngineRegister.registerPlugins(plugins);
UIEngineRegister.registerHandlers(handlers);

const App: React.FC = () => {
  const [current, setCurrent] = useState();
  useEffect(
    () => {
      const controller = NodeController.getInstance()
      const num = controller.request.injectInterceptor('request', (config: any) => {
        const token = window.sessionStorage.getItem('token')
        if (token) {
          if (config.headers) {
            config.headers['Authorization'] = `A10 ${token}`
          } else {
            config.headers = { Authorization: `A10 ${token}` }
          }
        }
        return config
      })

      return () => {
        if (num) {
          controller.request.ejectInterceptor('request', num)
        }
      }
    },
    []
  )

  let loginLayout = "login.json";

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
    nodeController.workflow.addLayout(
      'app',
      loginLayout,
      {
        schema: loginLayout,
        loadOptions,
      }
    );
  };

  const headers: any = requestConfig.headers;
  const handleOK = () => {
    // const uiNode = controller.getUINode(loginLayout);
    const result = submitToAPI([{ source: "credentials" }]);
    result.then((res: any) => {
      const token = _.get(res[0], "authresponse.signature");

      if (token) {
        sessionStorage.setItem("token", token);
      }

      console.log(sessionStorage.getItem("token"), " token fetched");
      const nodeController = NodeController.getInstance();
      nodeController.hideLayout(loginLayout);
    });
  };

  const handleCancel = () => {
    const nodeController = NodeController.getInstance();
    nodeController.hideLayout(loginLayout);
  };

  const token = sessionStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `A10 ${token}`;
  }
  const schema = "app.json";
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
        id={'app'}
        layouts={[schema]}
        // layouts={[]}
        config={{ requestConfig, widgetConfig }}
      />
    </BrowserRouter>
  );
};

export default App;
