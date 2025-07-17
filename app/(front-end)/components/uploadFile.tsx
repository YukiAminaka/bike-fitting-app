export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("No file uploaded or file is empty");
  }

  const filePath = file.webkitRelativePath || file.name;
  // 1. サーバーから署名付きURLを取得
  const response = await fetch("/api/video/presigned_url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filePath: filePath,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get presigned URL");
  }

  const { url } = await response.json();

  if (!url) {
    throw new Error("Failed to get presigned URL");
  }

  // 2. 署名付きURLにPUTリクエストでファイルアップロード
  // todo: s3へのアップロードはフロントエンドで行う
  const uploadResponse = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to S3");
  } else {
    // 3. アップロード成功後にvideoを作成
    const response = await fetch("/api/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filePath: filePath,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to create video record");
    }
  }
}
