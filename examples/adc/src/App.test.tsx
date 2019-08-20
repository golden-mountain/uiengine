import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import deployment from './images/deployment.png'

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});
