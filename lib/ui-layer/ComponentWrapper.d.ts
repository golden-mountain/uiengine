import React from "react";
import { IComponentWrapper, IComponentState } from "../../typings";
declare class ComponentWrapper extends React.Component<IComponentWrapper, IComponentState> {
    constructor(props: IComponentWrapper);
    componentWillUnmount(): void;
    componentWillUpdate(): void;
    render(): JSX.Element | null;
}
export default ComponentWrapper;
