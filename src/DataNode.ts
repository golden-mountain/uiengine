import _ from "lodash";
// import { Request } from ".";
import Axios, { AxiosPromise } from "axios";
import { IDataNode, IDataSource, IDataSchema } from "../typings/DataNode";

export default class DataNode implements IDataNode {
  private errorInfo: IErrorInfo = {};
  private request: IRequest = {} as IRequest;
  private schema: IDataSchema = {};
  private data: any;

  constructor(source: IDataSource, request?: IRequest) {
    if (request) this.request = request;

    if (source.isURL) {
      this.data = this.loadData(source.value);
    } else {
      this.data = source.value;
    }
  }

  getData(path?: any) {
    return path ? _.get(this.data, path, this.data) : this.data;
  }

  async loadData(source: string): Promise<AxiosPromise> {
    let response: any = await this.request.get(source);

    if (response.data) {
      this.data = response.data;
    } else {
      this.errorInfo = {
        code: `Error loading from ${source}`
      };
    }
    // this.data = response;
    // console.log("l....................");
    return response;
  }
}
