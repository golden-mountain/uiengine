import { IUINode } from "../../../typings";
/**
 * From schema define, get registered components
 * @param componentLine like antd:Component
 */
export declare function getComponent(componentLine?: string): any;
/**
 * Search UINodes which has the search condition props
 *
 * @param prop the schema defined props
 * @param rootName the root name of the loaded schema nodes
 * @return UINodes has the props
 */
export declare function searchNodes(prop: object, layout?: string): any[];
/**
 * Search the node who deps on me
 * A => Dep => B(myNode)
 *
 * @param myNode depend on node
 * @returns UINodes which depends on my result
 */
export declare function searchDepsNodes(myNode: IUINode): any[];
