
import React from 'react';

export const FormContainer: React.FC<any> = (props) => {
  return (
    <div>
      <h1>{props.title || null}</h1>
      <form>{props.children || null}</form>
    </div>
  );
}
