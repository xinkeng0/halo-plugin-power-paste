import { Extension } from "@halo-dev/richtext-editor";
import { Plugin, PluginKey } from "@halo-dev/richtext-editor";
import { powerPaste } from "./power-paste";

export type PowerPasteOptions = {
  HTMLAttributes: Record<string, any>;
};

export const ExtensionPowerPaste = Extension.create<PowerPasteOptions>({
  name: "power-paste",
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("powerPaste"),
        props: {
          handlePaste: (view, event, slice) => {
            /* … */
            return powerPaste.handlePaste!(editor, view, event, slice) || false;
          },
          // … and many, many more.
          // Here is the full list: https://prosemirror.net/docs/ref/#view.EditorProps
        },
      }),
    ];
  },
});
