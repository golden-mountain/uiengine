import React from "react";
import { Modal } from "antd";
import { UIEngineContext, ComponentWrapper, UINode } from "UIEngine";
import { IUINode } from "UIEngine/typings";

export class A10Modal extends React.Component<any, any> {
  static contextType = UIEngineContext;

  state = { uiNode: new UINode({}), visible: false };

  componentDidMount() {
    const result = this.context.controller
      .loadUINode(this.props.layout)
      .then((node: IUINode) => {
        this.setState({ uiNode: node, visible: true });
      });
  }

  handleOk = (e: any) => {
    if (this.state.uiNode !== undefined) {
      const uiNode: any = this.state.uiNode;
      console.log(uiNode.dataNode.submit(["slb"]));
    }

    // console.log(e);
    this.props.close();
  };

  handleCancel = (e: any) => {
    // console.log(e);
    this.props.close();
  };

  render() {
    const { layout, ...rest } = this.props;

    return this.state.visible ? (
      <Modal
        {...rest}
        visible={this.state.uiNode ? true : false}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        <ComponentWrapper uiNode={this.state.uiNode} key={`layout-${layout}`} />
      </Modal>
    ) : null;
  }
}
