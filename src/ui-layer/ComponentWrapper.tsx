import React, { useState, useEffect } from "react";
import _ from "lodash";

import { UIEngineRegister } from "..";
import { IComponentWrapper, IComponentState } from "../../typings";

function setComponentState(this: ComponentWrapper, state: IComponentState) {
  console.log("node status on Wrapper:", this.props.uiNode.id, state);
  return this.setState(state);
}

class ComponentWrapper extends React.Component<
  IComponentWrapper,
  IComponentState
> {
  constructor(props: IComponentWrapper) {
    super(props);
    const { uiNode } = props;
    const visible = uiNode.stateNode.getState("visible");
    const data = uiNode.dataNode.getData();
    const initialState: IComponentState = { state: { visible }, data };
    this.state = initialState;

    // register setState func
    uiNode.messager.setStateFunc(uiNode.id, setComponentState.bind(this));
  }

  componentWillUnmount() {
    this.props.uiNode.messager.removeStateFunc(this.props.uiNode.id);
  }

  componentWillUpdate() {
    console.log("state received on Wrapper:", this.props.uiNode.id, this.state);
  }

  render() {
    const { uiNode, ...rest } = this.props;
    if (!_.get(this.state, "state.vislble", true)) {
      console.log(uiNode.id, "is invisible");
      return null;
    }

    if (uiNode.schema) {
      // render logic
      const componentLine = _.get(uiNode.schema, "component");
      if (!componentLine) return null;

      // get registered component
      const componentMap = UIEngineRegister.componentsLibrary;
      const [packageName, component] = componentLine.split(":");
      const WrappedComponent: any = componentMap[packageName]
        ? componentMap[packageName][component]
        : componentMap[component];

      // map children as components
      let childrenObjects = uiNode.children.map((child: any) => {
        if (_.isArray(child)) {
          return child.map((c: any) => {
            const props = { ...rest, uiNode: c, ...c.props };
            return <ComponentWrapper {...props} />;
          });
        }
        const props = { ...rest, uiNode: child, ...child.props };
        return <ComponentWrapper {...props} />;
      });

      if (WrappedComponent) {
        try {
          return uiNode.children.length ? (
            <WrappedComponent {...rest} {...uiNode.props}>
              {childrenObjects}
            </WrappedComponent>
          ) : (
            <WrappedComponent {...rest} {...uiNode.props} />
          );
        } catch (e) {
          console.log(e);
        }
      }
    }

    return null;
  }
}

export default ComponentWrapper;

// const ComponentWrapper = (props: IComponentWrapper) => {
//   const { uiNode, ...rest } = props;

//   if (uiNode.schema) {
//     // checek state visible
//     const visible = uiNode.stateNode.getState("visible");
//     const data = uiNode.dataNode.getData();
//     const initialState: IComponentState = { state: { visible }, data };
//     const [componentState, setComponentState] = useState(initialState);
//     if (!_.get(componentState, "state.visible")) return null;

//     // render logic
//     const componentLine = _.get(uiNode.schema, "component");
//     if (!componentLine) return null;

//     // get registered component
//     const componentMap = UIEngineRegister.componentsLibrary;
//     const [packageName, component] = componentLine.split(":");
//     const WrappedComponent: any = componentMap[packageName]
//       ? componentMap[packageName][component]
//       : componentMap[component];

//     // map children as components
//     let childrenObjects = uiNode.children.map((child: any) => {
//       if (_.isArray(child)) {
//         return child.map((c: any) => ComponentWrapper({ ...props, uiNode: c }));
//       }
//       return ComponentWrapper({ ...props, uiNode: child });
//     });

//     if (WrappedComponent) {
//       try {
//         // set & clear setComponentState func for messager
//         uiNode.messager.setStateFunc(setComponentState);
//         // useEffect(() => {
//         //   console.log("use effect");
//         //   return () => {
//         //     uiNode.messager.removeStateFunc();
//         //   };
//         // }, []);

//         return uiNode.children.length ? (
//           <WrappedComponent {...rest} {...uiNode.props}>
//             {childrenObjects}
//           </WrappedComponent>
//         ) : (
//           <WrappedComponent {...rest} {...uiNode.props} />
//         );
//       } catch (e) {
//         console.log(e);
//       }
//     }
//   }

//   return null;
// };
