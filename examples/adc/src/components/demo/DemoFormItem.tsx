import React from "react";
import { Form } from "antd";

export const DemoFormItem: React.FC<any> = props => {
  const { children, label } = props;
  return <Form.Item label={label}>{children}</Form.Item>;
};
