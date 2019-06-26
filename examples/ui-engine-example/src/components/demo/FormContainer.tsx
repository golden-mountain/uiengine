
import React from 'react';

export const FormContainer: React.FC<any> = (props) => {
  return (
    <div>
      <h1>{props.title}</h1>
      <form>{props.children}</form>
    </div>
  );
}


