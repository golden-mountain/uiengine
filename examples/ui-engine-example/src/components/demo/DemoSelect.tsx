import React from "react";

export const DemoSelect: React.FC<any> = props => {
  // console.log(props);
  const { options, value, title } = props;
  // const options = layout.get("options", []);
  const onChange = (e: any) => {
    // layout.setIn(['runtime', 'visible'], false);
    // modelManager.getLayoutManager().updateModel(path, e.currentTarget.value);
  };

  return (
    <label>
      {title}
      <select onChange={onChange} value={value}>
        {options.map((option: any, index: number) => {
          return (
            <option value={option.value} key={index}>
              {option.name}
            </option>
          );
        })}
      </select>
    </label>
  );
};
