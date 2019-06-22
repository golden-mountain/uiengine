import { AxiosResponse } from "axios";
export interface IResponse extends AxiosResponse {}

export interface IDataSchema {}

export interface IDataMapper {
  mapSourceToURL(source: string);
}

export interface IDataEngine {
  loadData(source: string): IResponse;
  updateData(source: string, data: any): IResponse;
  replaceData(source: string, data: any): IResponse;
  deleteData(source: string): IResponse;
}
