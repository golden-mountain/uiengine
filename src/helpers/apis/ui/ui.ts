import UINodeProxy from "./UINodeProxy";

export function ui(selector: object, layoutId?: string) {
  return ui.select(selector, layoutId);
}

// selector could be an IUINode or SchemaSelector
ui.select = (selector: object, layoutId?: string) => {
  // const uiNodeProxy = new UINodeProxy()
};
