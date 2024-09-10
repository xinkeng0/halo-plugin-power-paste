import { EditorView, Slice, CoreEditor } from "@halo-dev/richtext-editor";
import { uploadImage } from "@/service";

export declare interface RTFImage {
  width?: number;
  height?: number;
  type: string;
  suffix: string;
  hex: string;
  id?: string;
  name?: string;
}

function hexStringToByteArray(hex: string) {
  const byteArray = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    byteArray[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return byteArray;
}

export const powerPaste = {
  handlePaste(
    editor: CoreEditor,
    view: EditorView,
    event: ClipboardEvent,
    slice: Slice,
  ) {
    /* … */
    console.debug("power paste handle~~~");
    if (!event.clipboardData) {
      return false;
    }
    const rtf = event.clipboardData.types.includes("text/rtf");
    if (!rtf) {
      return false;
    }
    const textHtml = event.clipboardData.getData("text/html");
    if (!textHtml) {
      return false;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(textHtml, "text/html");
    const imgs = doc.querySelectorAll("img");
    if (imgs.length === 0) {
      return false;
    }
    const textRtf = event.clipboardData.getData("text/rtf");
    const legacyPictures = word.extractImageDataFromRtf(textRtf);
    if (imgs.length !== legacyPictures.length) {
      return false;
    }
    // async
    const uploadImages = [];
    for (let index = 0; index < imgs.length; index++) {
      const element = imgs[index];
      const picture = legacyPictures[index];
      const data = picture.hex
        .match(/\w{2}/g)!
        .map((char) => {
          return String.fromCharCode(parseInt(char, 16));
        })
        .join("");
      const base64Str = btoa(data);
      const imageSrc = `data:${picture.type};base64,${base64Str}`;
      element.src = imageSrc;
      // TODO upload image
      const byteArray = hexStringToByteArray(picture.hex);
      const fileName =
        picture.name || picture.id || new Date().getTime() + picture.suffix;
      const file = new File([byteArray], fileName, { type: picture.type });
      element.src = URL.createObjectURL(file);
      uploadImages.push(
        uploadImage(file).then((res) => {
          element.src =
            res.data.status?.permalink ||
            res.data.metadata.annotations?.["storage.halo.run/uri"] ||
            "";
        }),
      );
    }
    Promise.all(uploadImages).then(() => {
      const content = doc.body.innerHTML;
      console.debug("content", content);
      editor.chain().focus().insertContent(content).run();
    });
    return true;
  },
};

export const word = {
  /**
   * Extracts image data (hex and type) from an RTF string.
   * <p>
   * example:
   *  pictureFragment: {\pict \piccropl0 \piccropr0 \piccropt0 \piccropb0 \picscalex100 \picscaley100 \picw164 \pich164 \picwgoal1230 \pichgoal1230 \wmetafile8 {\*\blipuid 5a74d0715a74d0715a74d0715a74d071}0100}
   * @param {string} rtfData - The RTF string to extract image data from.
   * @returns {Array} An array of objects containing the image data. Each object has two properties:
   *                   - hex: A string containing the hex data of the image.
   *                   - type: A string representing the type of the image (e.g., 'image/png', 'image/jpeg').
   */
  extractImageDataFromRtf(rtfData: string): RTFImage[] {
    // const regexPictureHeader =
    //   /{\\pict[\s\S]+?(\\bliptag-?\d+)?(\\blipupi-?\d+)?({\\\*\\blipuid\s?[\da-fA-F]+)?[\s}]*?/;
    // const regexPicture = new RegExp(
    //   "(?:(" + regexPictureHeader.source + "))([\\da-fA-F\\s]+)\\}",
    //   "g",
    // );
    const regexPictureHeader =
      /{\\pict[\s\S]+?\\bliptag-?\d+(\\blipupi-?\d+)?({\\\*\\blipuid\s?[\da-fA-F]+)?[\s}]*?/;
    const regexPicture = new RegExp(
      "(?:(" + regexPictureHeader.source + "))([\\da-fA-F\\s]+)\\}",
      "g",
    );
    const imagesGroup = rtfData.match(regexPicture);
    const result: RTFImage[] = [];

    if (imagesGroup) {
      for (const image of imagesGroup) {
        console.debug(`image`, image);
        const rtfImage: RTFImage = {
          type: "",
          suffix: "",
          hex: "",
        };
        if (image.includes("\\pngblip")) {
          rtfImage.type = "image/png";
          rtfImage.suffix = ".png";
        } else if (image.includes("\\jpegblip")) {
          rtfImage.type = "image/jpeg";
          rtfImage.suffix = ".jpg";
        } else if (image.includes("\\wmetafile8")) {
          // https://www.rfc-editor.org/rfc/rfc7903.html
          // https://datatracker.ietf.org/doc/html/rfc7903
          // I currently don't know how to handle this type of file.
          rtfImage.type = "data:image/x-wmf";
          rtfImage.suffix = ".wmf";
          continue;
        } else {
          continue;
        }
        // /^\{\\pict[^{}]*(?:\{[^{}]*\})?([^{}]+)\}$/
        // const simpleRegex = /^\{\\pict[^{}]*(?:\{[^{}]*\})?([^{}]+)\}$/;
        // const simplifiedHexData = image.replace(simpleRegex, (match, p1) => {
        //   console.debug("Simplified Match:", match);
        //   console.debug("Simplified Hex Data:", p1);
        //   return p1;
        // });
        rtfImage.hex = image
          .replace(regexPictureHeader, "")
          .replace(/[^\da-fA-F]/g, "");
        console.debug(`rtfImage`, rtfImage);
        result.push(rtfImage);
      }
    }
    return result;
  },
};
