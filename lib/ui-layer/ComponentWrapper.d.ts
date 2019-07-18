import React from "react";
import { IComponentWrapper, IComponentState, IPluginManager } from "../../typings";
declare class ComponentWrapper extends React.Component<IComponentWrapper, IComponentState> {
    pluginManager: IPluginManager;
    constructor(props: IComponentWrapper);
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): JSX.Element | null;
}
export default ComponentWrapper;
