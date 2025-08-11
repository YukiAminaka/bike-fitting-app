import { getSignedCookies } from "@aws-sdk/cloudfront-signer";
import fs from "fs";
import path from "path";

export const createPresignedCookie = (userid: string) => {
  const cloudfrontDistributionDomain = "https://static.ami-works.com";
  const url = `${cloudfrontDistributionDomain}/users/${userid}/m3u8/*`;
  const privateKey = fs.readFileSync(path.resolve("private_key.pem"), "utf-8");
  const keyPairId = "K2DTJW2OP7KKU8";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const epochTime = Math.round(tomorrow.getTime() / 1000);

  const policy = {
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": epochTime, // time in seconds
          },
        },
      },
    ],
  };

  const policyString = JSON.stringify(policy);

  const cookies = getSignedCookies({
    keyPairId,
    privateKey,
    policy: policyString,
  });
  return cookies;
};
