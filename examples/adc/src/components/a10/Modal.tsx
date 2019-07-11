import React from "react";
import { Modal } from "antd";
import { UIEngineContext, ComponentWrapper, UINode, DataPool } from "UIEngine";
import { IUINode } from "UIEngine/typings";

export class A10Modal extends React.Component<any, any> {
  static contextType = UIEngineContext;

  state = { uiNode: new UINode({}), visible: false };

  componentDidMount() {
    const dataPool = DataPool.getInstance();
    dataPool.merge(
      `slb.virtual-server:port-list[${this.props.datakey}]`,
      "slb.virtual-server.port:",
      false
    );
    this.context.controller
      .loadUINode(this.props.layout)
      .then((node: IUINode) => {
        const data = dataPool.get("slb.virtual-server.port:", false);
        node.dataNode.updateData(data).then(() => {
          this.setState({ uiNode: node, visible: true });
        });
      });
  }

  handleOk = async (e: any) => {
    if (this.state.uiNode !== undefined) {
      const uiNode: any = this.state.uiNode;
      uiNode.dataNode.dataPool.merge(
        "slb.virtual-server.port:",
        "slb.virtual-server:port-list[]",
        true
      );
    }

    // console.log(e);
    await this.props.uinode.updateLayout();
    this.props.close();
  };

  handleCancel = (e: any) => {
    // console.log(e);
    this.props.close();
  };

  render() {
    const { layout, uinode, ...rest } = this.props;
    return this.state.visible ? (
      <Modal
        {...rest}
        visible={this.state.uiNode ? true : false}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        <ComponentWrapper uiNode={this.state.uiNode} key={layout} />
      </Modal>
    ) : null;
  }
}
