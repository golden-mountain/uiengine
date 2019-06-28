import React from "react";
import { Form } from "antd";

export const DemoFormItem: React.FC<any> = props => {
  const { form, config, children, path, label } = props;
  // console.log(props);
  return (
    <Form.Item label={label}>
      {/* {React.Children.map(children, (child: any) => {
        return form.getFieldDecorator(path, config)(child);
      })} */}
      {children}
    </Form.Item>
  );
};
