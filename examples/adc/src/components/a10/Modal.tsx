import React from "react";
import { Modal } from "antd";
import { UIEngineContext, ComponentWrapper } from "UIEngine";
import { IUINode } from "UIEngine/typings";

export class A10Modal extends React.Component<any, any> {
  static contextType = UIEngineContext;

  state = { uiNode: undefined };

  componentDidMount() {
    const result = this.context.controller
      .loadUINode(this.props.layout)
      .then((node: IUINode) => {
        console.log("loaded on a10modal");
        this.setState({ uiNode: node });
      });
  }

  handleOk = (e: any) => {
    // console.log(e);
    this.props.close();
  };

  handleCancel = (e: any) => {
    // console.log(e);
    this.props.close();
  };

  render() {
    const { layout, ...rest } = this.props;

    return this.state.uiNode !== null ? (
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
