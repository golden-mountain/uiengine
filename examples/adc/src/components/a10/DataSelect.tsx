import React, { useState } from "react";
import { Select } from "antd";

export const DataSelect = (props: any) => {
  const { children, uinode, associations, ...rest } = props;
  // load data
  // console.log(uinode, associations);
  const [assocs, setAssocs] = useState([]);
  const load = async () => {
    const data = await uinode.dataNode.dataEngine.loadData(
      "access-list-standard:standard-list"
    );
    console.log("acl-id-data", data);
    console.log("assocs", assocs);

    // setAssocs(assocs);
  };
  load();
  return (
    <Select {...rest}>
      {/* {assocs.map((data: any) => {
        return <Select.Option>{}</Select.Option>;
      })} */}
    </Select>
  );
};
