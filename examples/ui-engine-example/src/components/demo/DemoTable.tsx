import React from "react";

export const DemoTable: React.FC<any> = props => {
  const { title, children } = props;
  return (
    <div>
      <h1>{title}</h1>
      <table>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export const DemoTr: React.FC<any> = props => {
  const { children } = props;
  return <tr>{children}</tr>;
};

export const DemoTd: React.FC<any> = props => {
  const { value, children } = props;
  return (
    <td>
      {value} {children}{" "}
    </td>
  );
};
