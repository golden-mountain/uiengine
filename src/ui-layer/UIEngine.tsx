import React, { useState } from "react";
import _ from "lodash";

import { NodeController, ComponentWrapper } from "..";
import { IUINode, INodeController, IUIEngineProps } from "../../typings";

export default (props: IUIEngineProps) => {
  const nodeController: INodeController = new NodeController(props.reqConfig);
  const [nodes, setNodes] = useState([]);

  const { layouts = [] } = props;
  for (let layout in layouts) {
    nodeController.loadUINode(layouts[layout]).then((uiNode: any) => {
      setNodes(uiNode);
    });
  }

  return nodes.map((uiNode: IUINode) => {
    return <ComponentWrapper uiNode={uiNode} {...props} />;
  });
};
