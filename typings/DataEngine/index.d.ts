import { AxiosResponse } from "axios";
interface IResponse extends AxiosResponse {}

interface IDataSchema {}

interface IDataMapper {
  mapSourceToURL(source: string);
}

interface IDataEngine {
  loadData(source: string): IResponse;
  updateData(source: string, data: any): IResponse;
  replaceData(source: string, data: any): IResponse;
  deleteData(source: string): IResponse;
}
