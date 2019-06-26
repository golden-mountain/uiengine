import React from "react";

export const DemoInput: React.FC<any> = props => {
  const { title, value, onChange } = props;
  return (
    <label>
      {title}
      <input defaultValue={value} onChange={onChange} />
    </label>
  );
};
