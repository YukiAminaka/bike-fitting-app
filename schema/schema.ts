import { z } from "zod";

export const videoSchema = z.object({
  filePath: z.string(),
});

export type Video = {
  id: string;
  filePath: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};
