"use client";

import { Video } from "@/generated/prisma";
import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const VideoList = ({ videos }: { videos: Video[] }) => {
  const [cookieSet, setCookieSet] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const setCookie = async () => {
      const res = await fetch("/api/video/presigned_cookie", {
        method: "GET",
        credentials: "include", // Cookie をブラウザに保存させる
      });
      if (!res.ok) {
        console.error("Failed to set presigned cookie");
        return;
      }
      setCookieSet(true);
    };
    setCookie();
  }, []);

  useEffect(() => {
    if (!cookieSet || !videos) return;

    videos.forEach((video) => {
      const videoElement = videoRefs.current[video.id];
      if (videoElement && Hls.isSupported()) {
        const hls = new Hls({
          debug: true,
          xhrSetup: (xhr, url) => {
            xhr.withCredentials = true; // Cookie を CloudFront に送信
          },
        });
        const videoSrc = `https://static.ami-works.com/users/${video.userId}/m3u8/${video.filePath}/${video.filePath}.m3u8`;
        hls.loadSource(videoSrc);
        hls.attachMedia(videoElement);
      } else if (
        videoElement &&
        videoElement.canPlayType("application/vnd.apple.mpegurl")
      ) {
        // Safariなど、ネイティブHLS対応ブラウザ用
        videoElement.src = `https://static.ami-works.com/users/${video.userId}/m3u8/${video.filePath}/${video.filePath}.m3u8`;
      }
    });
  }, [cookieSet, videos]);

  if (!videos || videos.length === 0) {
    return <p className="text-gray-500">No videos available</p>;
  }

  return (
    <div>
      {videos.map((video: Video) => (
        <div key={video.id} className="mb-4">
          <h3 className="text-lg font-semibold">{video.filePath}</h3>
          <video
            ref={(el) => {
              videoRefs.current[video.id] = el;
            }}
            controls
            muted
            width="100%"
            height="100%"
            style={{ backgroundColor: "black" }}
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

export default VideoList;
