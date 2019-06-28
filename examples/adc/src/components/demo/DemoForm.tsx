import React from "react";
import { Form } from "antd";

class DemoFormInner extends React.Component<any> {
  // handleSubmit = (e: any) => {
  //   e.preventDefault();
  //   this.props.form.validateFieldsAndScroll((err: any, values: any) => {
  //     if (!err) {
  //       console.log("Received values of form: ", values);
  //     }
  //   });
  // };

  render() {
    const { form, children, ...rest } = this.props;
    // console.log(getFieldDecorator);
    return (
      <Form {...rest}>
        {/* {React.Children.map(children, (child: any) => {
          return React.cloneElement(child, {
            form
          });
        })} */}
        {children}
      </Form>
    );
  }
}

export const DemoForm = Form.create()(DemoFormInner);
