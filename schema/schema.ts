import { z } from "zod";

export const videoSchema = z.object({
  filePath: z.string(),
});
