import React from "react";
import { Button as AButton } from "antd";

export const Button = (props: any) => {
  const { text, ...rest } = props;
  return <AButton {...rest}>{text}</AButton>;
};
