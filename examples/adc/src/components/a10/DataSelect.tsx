import React, { useState } from "react";
import { Select } from "antd";
import _ from "lodash";

export const DataSelect = (props: any) => {
  const {
    children,
    uinode,
    associations,
    select: {
      datasource,
      optionmap: { title, value }
    },
    ...rest
  } = props;
  // load data
  // console.log(uinode, associations);
  const [assocs, setAssocs] = useState([]);
  const source = { source: datasource };
  uinode.dataNode.dataEngine.loadData(source).then((data: any) => {
    setAssocs(_.get(data, datasource.replace(":", ".")));
  });
  return (
    <Select {...rest}>
      {assocs &&
        assocs.map((data: any, index: number) => {
          return (
            <Select.Option value={_.get(data, title)} key={index}>
              {_.get(data, value)}
            </Select.Option>
          );
        })}
    </Select>
  );
};
