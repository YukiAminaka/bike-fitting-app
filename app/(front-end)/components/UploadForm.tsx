"use client";

import { useState } from "react";

export function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      setMessage("ファイルを選択してください");
      return;
    }

    // 動画ファイルかチェック
    if (!file.type.startsWith("video/")) {
      setMessage("動画ファイルを選択してください");
      return;
    }

    // MIMEタイプチェック
    if (file.type !== "video/mp4") {
      alert("mp4動画のみアップロード可能です");
      return;
    }

    setUploading(true);
    setMessage("");
    setUploadProgress(0);

    try {
      // 1. 署名付きURLを取得
      const presignedResponse = await fetch("/api/video/presigned_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: file.name,
        }),
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(error.error || "署名付きURLの取得に失敗しました");
      }

      const { presignedUrl, fileName } = await presignedResponse.json();

      if (!presignedUrl) {
        throw new Error("署名付きURLが取得できませんでした");
      }

      // 2. S3に直接アップロード（XMLHttpRequestを使用してプログレス表示）
      await uploadToS3(file, presignedUrl, (progress) => {
        setUploadProgress(progress);
      });

      // 3. アップロード成功後にvideoレコードを作成（ユニークなファイル名を使用）
      const videoResponse = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: fileName,
        }),
      });

      if (!videoResponse.ok) {
        const error = await videoResponse.json();
        throw new Error(error.error || "動画レコードの作成に失敗しました");
      }

      setMessage("アップロードが完了しました！");
      setUploadProgress(100);

      // フォームをリセット
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(
        error instanceof Error ? error.message : "アップロードに失敗しました"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            動画ファイルを選択
          </label>
          <input
            type="file"
            name="file"
            id="file"
            accept="video/mp4"
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "アップロード中..." : "アップロード"}
        </button>

        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {uploading && (
          <p className="text-sm text-gray-600 text-center">
            {uploadProgress}% 完了
          </p>
        )}

        {message && (
          <p
            className={`text-sm text-center ${
              message.includes("完了") || message.includes("成功")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

// S3への直接アップロード関数（プログレス付き）
async function uploadToS3(
  file: File,
  presignedUrl: string,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // プログレス監視
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    // 完了時の処理
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`S3へのアップロードに失敗しました: ${xhr.status}`));
      }
    });

    // エラー時の処理
    xhr.addEventListener("error", () => {
      reject(new Error("ネットワークエラーが発生しました"));
    });

    // アボート時の処理
    xhr.addEventListener("abort", () => {
      reject(new Error("アップロードがキャンセルされました"));
    });

    // リクエストを設定
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    // ファイルを送信
    xhr.send(file);
  });
}
