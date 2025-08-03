import { auth } from "@/auth";
import { UploadForm } from "../components/UploadForm";
import VideoList from "../components/videoList";
import prisma from "@/lib/prisma";

export default async function Page() {
  const session = await auth();
  if (!session?.user) return <div>Not authenticated</div>;

  // 動画の取得
  const videos = await prisma.video.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto p-4">
      <UploadForm />
      <div className="flex flex-col items-center mt-8">
        <VideoList videos={videos} />
      </div>
    </div>
  );
}
