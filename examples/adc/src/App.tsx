import React, { useState } from "react";
import { BrowserRouter, Link } from "react-router-dom";
import { Menu, PageHeader, Button, Modal } from "antd";

import { default as components } from "./components";
import * as plugins from "./plugins";
import requestConfig from "./config/request";
import { UIEngineRegister, UIEngine } from "UIEngine";
import "./App.css";
import { INodeController } from "../../../typings";

UIEngineRegister.registerComponents(components);
UIEngineRegister.registerPlugins(plugins);

const App: React.FC = () => {
  const [current, setCurrent] = useState();
  const [visible, setVisible] = useState(false);

  let loginLayout = "schema/ui/login.json";
  let controller: INodeController;
  const onEngineCreate = (nodeController: INodeController) => {
    controller = nodeController;
  };

  const handleClick = (e: any) => {
    setCurrent(e.key);
  };

  const showLogin = () => {
    setVisible(true);
  };

  const handleOK = () => {
    setVisible(false);
    const uiNode = controller.getUINode(loginLayout);
    uiNode.dataNode.submit(["credentials"]);
  };

  const handleCancel = () => {
    setVisible(false);
  };

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
          onEngineCreate={onEngineCreate}
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
