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
  const load = async () => {
    const data = await uinode.dataNode.dataEngine.loadData(datasource);
    setAssocs(_.get(data, datasource.replace(":", ".")));
  };
  load();
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
