import _ from "lodash";
/**
 * use for storing some common data, like context data to the none React class
 */
class MemoStore {
  static instance: MemoStore;
  static getInstance() {
    if (!MemoStore.instance) {
      MemoStore.instance = new MemoStore();
    }
    return MemoStore.instance;
  }

  static bucket: any = {
    preview: true,
    clipboard: null
  };
}

export default MemoStore;
