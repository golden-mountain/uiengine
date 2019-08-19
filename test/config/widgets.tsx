import React from "react";
// import { message } from "antd";

const widgetsConfig = {
  //   messager: (props: any) => {
  //     if (props.status > 0) {
  //       message.error(props.code);
  //     } else {
  //       message.success(props.code);
  //     }
  //     return null;
  //   }
  componentWrapper: (props: any) => {
    return <div>{props.children}</div>;
  }
};

export default widgetsConfig;
