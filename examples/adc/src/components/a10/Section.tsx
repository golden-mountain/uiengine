import React from "react";
import { Collapse } from "antd";

const { Panel } = Collapse;

function callback(key: any) {
  console.log(key);
}

export const Section = (props: any) => {
  const { children, title, defaultActiveKey } = props;
  return (
    <div style={{ marginBottom: "6px" }}>
      <Collapse defaultActiveKey={defaultActiveKey} onChange={callback}>
        <Panel header={title} key="1">
          {children}
        </Panel>
      </Collapse>
    </div>
  );
};
