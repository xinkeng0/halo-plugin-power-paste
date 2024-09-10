// see https://docs.halo.run/developer-guide/plugin/api-reference/ui/api-request
import { consoleApiClient, type Attachment } from "@halo-dev/api-client";
import type { AxiosResponse } from "axios";

export async function uploadImage(
  file: File,
): Promise<AxiosResponse<Attachment, any>> {
  // http://localhost:8090/apis/api.console.halo.run/v1alpha1/attachments/upload
  return consoleApiClient.storage.attachment.uploadAttachment({
    file: file,
    policyName: "default-policy",
    groupName: "",
  });
}
