// src/hooks/use-pexels-videos.ts
import { useState, useCallback } from "react";
import { IVideo } from "@designcombo/types";

// Raw response type from Pexels API
interface PexelsVideoRaw {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string; // This is the preview image
  duration: number;
  user: any;
  video_files: Array<{
    id: number;
    quality: string; // 'hd', 'sd', etc.
    file_type: string;
    width: number;
    height: number;
    link: string; // The actual video URL
  }>;
  video_pictures: any[];
}

interface PexelsVideoResponse {
  videos: PexelsVideoRaw[];
  total_results: number;
  page: number;
  per_page: number;
  next_page?: string;
  prev_page?: string;
}

// Helper to map Pexels data to your App's IVideo format
const mapPexelsVideoToVideo = (video: PexelsVideoRaw): Partial<IVideo> => {
  // Find the best quality video file (prefer HD, fallback to first one)
  const videoFile =
    video.video_files.find((f) => f.quality === "hd") || video.video_files[0];

  return {
    id: String(video.id),
    preview: video.image, // Sidebar preview image
    details: {
      src: videoFile?.link, // Actual video URL for the player
      width: videoFile?.width || video.width,
      height: videoFile?.height || video.height,
    } as any,
    duration: video.duration, // Duration in seconds
    type: "video",
  };
};

export function usePexelsVideos() {
  const [videos, setVideos] = useState<Partial<IVideo>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchVideos = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: PexelsVideoResponse = await response.json();

      // MAP DATA
      setVideos(data.videos.map(mapPexelsVideoToVideo));

      setTotalResults(data.total_results);
      setCurrentPage(data.page);
      setHasNextPage(!!data.next_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchVideos = useCallback(async (query: string, page = 1) => {
    const url = `/api/pexels-videos?query=${encodeURIComponent(query)}&page=${page}&per_page=15`;
    await fetchVideos(url);
  }, [fetchVideos]);

  const searchVideosAppend = useCallback(async (query: string, page = 1) => {
    setLoading(true);
    try {
      const url = `/api/pexels-videos?query=${encodeURIComponent(query)}&page=${page}&per_page=15`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error!`);
      const data: PexelsVideoResponse = await response.json();

      // MAP AND APPEND
      setVideos((prev) => [...prev, ...data.videos.map(mapPexelsVideoToVideo)]);

      setTotalResults(data.total_results);
      setCurrentPage(data.page);
      setHasNextPage(!!data.next_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPopularVideos = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/pexels-videos?page=${page}&per_page=15`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error!`);
      const data: PexelsVideoResponse = await response.json();

      // MAP DATA
      setVideos(data.videos.map(mapPexelsVideoToVideo));

      setTotalResults(data.total_results);
      setCurrentPage(data.page);
      setHasNextPage(!!data.next_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPopularVideosAppend = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const url = `/api/pexels-videos?page=${page}&per_page=15`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error!`);
      const data: PexelsVideoResponse = await response.json();

      // MAP AND APPEND
      setVideos((prev) => [...prev, ...data.videos.map(mapPexelsVideoToVideo)]);

      setTotalResults(data.total_results);
      setCurrentPage(data.page);
      setHasNextPage(!!data.next_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearVideos = useCallback(() => {
    setVideos([]);
    setError(null);
    setTotalResults(0);
    setCurrentPage(1);
    setHasNextPage(false);
  }, []);

  return {
    videos,
    loading,
    error,
    totalResults,
    currentPage,
    hasNextPage,
    searchVideos,
    loadPopularVideos,
    searchVideosAppend,
    loadPopularVideosAppend,
    clearVideos,
  };
}
