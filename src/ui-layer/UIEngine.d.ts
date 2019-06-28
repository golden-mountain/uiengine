import React from "react";
import { INodeController, IUIEngineProps, IUIEngineStates } from "../../typings";
export default class UIEngine extends React.Component<IUIEngineProps, IUIEngineStates> {
    nodes: any;
    state: {
        nodes: never[];
    };
    nodeController: INodeController;
    constructor(props: IUIEngineProps);
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): JSX.Element[];
}
