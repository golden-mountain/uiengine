import { IDataSource } from "../../../typings";
/**
 * convert a.b.c:d to a.b.c.d
 * if Prefix provided, convert to prefix.a.b.c.d
 * @param source
 * @param prefix
 */
export declare function formatSource(source: string, prefix?: string): string;
/**
 * convert id to a_b_c
 *
 * @param id a.b.c:d
 */
export declare function getDomainName(id: IDataSource | string, snakeCase?: boolean): string;
/**
 * convert source to a.b.c.
 * @param source
 */
export declare function parseSchemaPath(source: string): string;
/**
 * Convert source to a_b_c
 *
 * @param source
 * @param parsePath
 */
export declare function parseCacheID(source: string, parsePath?: boolean): string;
/**
 * export to a_b_c
 *
 * @param root like a-b-c.json
 */
export declare function parseRootName(root: string): string;
export declare function submitToAPI(dataSources: Array<IDataSource>, method?: string): Promise<any>;
