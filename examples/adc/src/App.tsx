import React, { useState } from "react";
import _ from "lodash";
import { BrowserRouter, Link } from "react-router-dom";
import { Menu, PageHeader, Button, Modal } from "antd";

import { default as components } from "./components";
import * as plugins from "./plugins";
import requestConfig from "./config/request";
import { UIEngineRegister, UIEngine, submitToAPI } from "UIEngine";
import "./App.css";
import { INodeController } from "../../../typings";

UIEngineRegister.registerComponents(components);
UIEngineRegister.registerPlugins(plugins);

const App: React.FC = () => {
  const [current, setCurrent] = useState();
  const [visible, setVisible] = useState(false);
  const [controller, setController] = useState<INodeController>();

  let loginLayout = "schema/ui/login.json";

  const handleClick = (e: any) => {
    setCurrent(e.key);
  };

  const showLogin = () => {
    setVisible(true);
  };

  const headers: any = requestConfig.headers;
  const handleOK = () => {
    setVisible(false);
    if (controller) {
      // const uiNode = controller.getUINode(loginLayout);
      const result = submitToAPI(["credentials"]);
      result.then((res: any) => {
        const token = _.get(res[0], "credentials.authresponse.signature");
        if (token) {
          sessionStorage.setItem("token", token);
          headers["Authorization"] = `A10 ${token}`;
        }
      });
    } else {
      console.error("controller missed", controller);
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const token = sessionStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `A10 ${token}`;
  }

  return (
    <BrowserRouter>
      <PageHeader
        onBack={() => null}
        title="UIEngine Examples"
        subTitle=" Demo Box"
        extra={[
          <Button key="1" onClick={showLogin}>
            Login
          </Button>
        ]}
      />
      <Modal
        title="Login"
        visible={visible}
        onOk={handleOK}
        onCancel={handleCancel}
      >
        <UIEngine
          layouts={[loginLayout]}
          reqConfig={requestConfig}
          onEngineCreate={setController}
        />
      </Modal>
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
