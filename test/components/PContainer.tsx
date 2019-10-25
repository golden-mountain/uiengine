import React from "react";
export default (props: any) => (
  <p>
    {props.title || null}
    {props.children || null}
  </p>
);
