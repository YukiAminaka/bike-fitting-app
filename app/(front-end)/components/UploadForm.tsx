"use client";

import { uploadFile } from "./uploadFile";

export function UploadForm() {
  return (
    <form action={uploadFile}>
      <input type="file" name="file" />
      <button type="submit">アップロード</button>
    </form>
  );
}
