import React from "react";
import { Tabs } from "antd";

export const DemoTabPane: React.FC<any> = props => {
  const TabPane = Tabs.TabPane;
  console.log(props);
  const { children, ...rest } = props;
  return <TabPane {...rest}>{children}</TabPane>;
};
