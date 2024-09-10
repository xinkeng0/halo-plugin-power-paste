import { definePlugin } from "@halo-dev/console-shared";
import { ExtensionPowerPaste } from "@/editor/power-paste";

export default definePlugin({
  components: {},
  routes: [],
  extensionPoints: {
    "default:editor:extension:create": () => {
      return [ExtensionPowerPaste];
    },
  },
});
