import React from "react";
export default (props: any) => (
  <div>
    {props.title || null}
    {props.children || null}
  </div>
);
