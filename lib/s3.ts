import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 関数ごとにS3Clientを生成すると大量に呼び出したときにエラーが出るため、グローバルに1つだけ生成する
export const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const createPresignedUrlWithClient = ({
  bucket,
  key,
  expiresIn = 600,
}: {
  region?: string;
  bucket: string;
  key: string;
  expiresIn?: number;
}) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

export const getS3StorageUsage = async ({
  bucketName,
  prefix,
  marker,
  storageUsage = 0,
}: {
  region?: string;
  bucketName: string;
  prefix: string;
  marker?: string;
  storageUsage?: number;
}): Promise<number> => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    StartAfter: marker,
  });

  const objectList = await s3Client.send(command);

  if (objectList.Contents) {
    for (const object of objectList.Contents) {
      storageUsage += object.Size || 0;
    }
  }

  if (objectList.IsTruncated) {
    return getS3StorageUsage({
      bucketName,
      prefix,
      marker: objectList.Contents?.[objectList.Contents.length - 1].Key,
      storageUsage,
    });
  }

  return storageUsage;
};

export const uploadToS3 = async ({
  bucket,
  key,
  body,
  contentType,
}: {
  bucket: string;
  key: string;
  body: string;
  contentType: string;
}): Promise<boolean> => {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Body: body,
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      })
    );
    return true;
  } catch (e) {
    return false;
  }
};

export const createPostPresignedUrl = async ({
  bucket,
  key,
  expiresIn = 600,
}: {
  bucket: string;
  key: string;
  expiresIn?: number;
}) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

export const getFileStringFromS3 = async (bucket: string, key: string) => {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });

    const response = await s3Client.send(command);
    const string = await response?.Body?.transformToString();

    return string;
  } catch (error) {
    return undefined;
  }
};

export const getImagePresignedUrl = async (
  uuid: string, // ファイル識別用のUUID
  filepathWithoutExt: string // 拡張子なしのファイルパス
): Promise<string | undefined> => {
  const bucket = process.env.AWS_S3_IMAGE_BUCKET;
  const prefix = `${uuid}/${filepathWithoutExt}.`;

  // INFO: 解析前の画像が存在するかどうかの確認
  const listParams = {
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: 1,
  };

  const listCommand = new ListObjectsV2Command(listParams);
  const listResponse = await s3Client.send(listCommand);

  const object = listResponse.Contents?.[0];

  if (object) {
    // オブジェクトが存在する場合、URLを生成
    const getObjectParams = {
      Bucket: bucket,
      Key: object.Key,
    };
    return getSignedUrl(s3Client, new GetObjectCommand(getObjectParams), {
      expiresIn: 1800,
    });
  }

  return undefined;
};

export const deleteFromS3 = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}): Promise<boolean> => {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

export const getObjectFromS3 = async (bucket: string, key: string) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return s3Client.send(command);
};

export const getAllObjectsFromS3 = async (bucket: string, prefix: string) => {
  let allObjects: any = [];
  let continuationToken;
  let response: any;

  do {
    const command: any = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    response = await s3Client.send(command);
    if (response.Contents) {
      allObjects = allObjects.concat(response.Contents);
    }
    continuationToken = response.NextContinuationToken;
  } while (response.IsTruncated);

  return allObjects;
};

export const getFileListFromS3 = async (bucket: string, prefix: string) => {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  return (
    response.Contents?.map((object) => ({
      key: object.Key,
      lastModified: object.LastModified,
    })) ?? []
  );
};

export const createUploadPresignedUrl = async ({
  bucket,
  key,
  expiresIn = 60,
  contentType,
}: {
  bucket: string;
  key: string;
  expiresIn?: number;
  contentType?: string;
}) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};
