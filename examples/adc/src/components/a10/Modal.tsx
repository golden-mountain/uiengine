import React from "react";
import { Modal } from "antd";
import { UIEngineContext, UINode, DataPool } from "uiengine";

export class A10Modal extends React.Component<any, any> {
  static contextType = UIEngineContext;

  state = { uiNode: new UINode({}), visible: false };

  componentDidMount() {
    const dataPool = DataPool.getInstance();
    dataPool.transfer(
      `slb.virtual-server:port-list[${this.props.datakey}]`,
      "slb.virtual-server.port:",
      { clearSrc: false }
    );
    this.setState({ visible: true });
    // this.context.controller
    //   .loadUINode(this.props.layout)
    //   .then((node: IUINode) => {
    //     const data = dataPool.get("slb.virtual-server.port:");
    //     node.dataNode.updateData(data).then(() => {
    //       this.setState({ uiNode: node, visible: true });
    //     });
    //   });
  }

  handleOk = async (e: any) => {
    if (this.state.uiNode !== undefined) {
      const uiNode: any = this.state.uiNode;
      uiNode.dataNode.dataPool.transfer(
        "slb.virtual-server.port:",
        `slb.virtual-server:port-list[${this.props.datakey}]`,
        { clearSrc: true }
      );
    }

    // console.log(e);
    await this.props.uinode.updateLayout();
    this.setState({ visible: false });
  };

  handleCancel = (e: any) => {
    // console.log(e);
    this.setState({ visible: false });
  };

  render() {
    const { layout, uinode, children, ...rest } = this.props;
    return this.state.visible ? (
      <Modal
        {...rest}
        visible={this.state.uiNode ? true : false}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        {children}
      </Modal>
    ) : null;
  }
}
