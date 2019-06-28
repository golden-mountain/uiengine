import React from "react";
import { Modal } from "antd";

export class DemoModal extends React.Component<any, any> {
  state = { visible: true };

  // showModal = () => {
  //   this.setState({
  //     visible: true
  //   });
  // };

  handleOk = (e: any) => {
    // console.log(e);
    this.setState({
      visible: false
    });
  };

  handleCancel = (e: any) => {
    // console.log(e);
    this.setState({
      visible: false
    });
  };

  render() {
    const { title = "Modal", children } = this.props;
    // console.log("modal props", this.props);
    return (
      <div>
        <Modal
          title={title}
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          {children}
        </Modal>
      </div>
    );
  }
}
