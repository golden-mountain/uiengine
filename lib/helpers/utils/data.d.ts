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
export declare function getDomainName(id: any, snakeCase?: boolean): string;
/**
 * convert source to a.b.c.
 * @param source
 */
export declare function parseSchemaPath(source: string): string;
export declare function parseCacheID(source: string, parsePath?: boolean): string;
export declare function submitToAPI(dataSources: Array<string>, method?: string): Promise<any>;
