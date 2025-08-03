"use client";

import { Video } from "@/generated/prisma";
import React, { useEffect } from "react";
import ReactPlayer from "react-player";

const videoList = ({ videos }: { videos: Video[] }) => {
  if (!videos || videos.length === 0) {
    return <p className="text-gray-500">No videos available</p>;
  }

  useEffect(() => {
    const setCookie = async () => {
      const res = await fetch("/api/video/presigned_cookie", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        console.error("Failed to set presigned cookie");
      }
    };
    setCookie();
  }, []);

  return (
    <div>
      {videos.map((video: Video) => (
        <div key={video.id} className="mb-4">
          <h3 className="text-lg font-semibold">{video.filePath}</h3>
          <ReactPlayer
            controls={true}
            playing={true}
            volume={0}
            muted={true}
            width="100%"
            height="100%"
            src={`https://d1bn71d3v93is3.cloudfront.net/users/${video.userId}/m3u8/${video.filePath}/${video.filePath}.m3u8`}
          />
          <p className="text-sm text-gray-500">
            Uploaded by User ID: {video.userId} on{" "}
            {new Date(video.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default videoList;
