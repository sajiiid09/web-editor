// src/hooks/use-pexels-images.ts
import { useState, useCallback } from "react";
import { IImage } from "@designcombo/types";

// Raw response type from Pexels API
interface PexelsPhotoRaw {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhotoRaw[];
  total_results: number;
  page: number;
  per_page: number;
  next_page?: string;
  prev_page?: string;
}

// Helper to map Pexels data to your App's IImage format
const mapPexelsToImage = (photo: PexelsPhotoRaw): Partial<IImage> => ({
  id: String(photo.id),
  preview: photo.src.medium, // Used for sidebar preview
  details: {
    src: photo.src.original, // Used for the actual editor canvas
    width: photo.width,
    height: photo.height,
  } as any,
});

export function usePexelsImages() {
  const [images, setImages] = useState<Partial<IImage>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchImages = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: PexelsResponse = await response.json();

      // MAP THE DATA HERE
      setImages(data.photos.map(mapPexelsToImage));

      setTotalResults(data.total_results);
      setCurrentPage(data.page);
      setHasNextPage(!!data.next_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch images");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchImages = useCallback(async (query: string, page = 1) => {
    const url = `/api/pexels?query=${encodeURIComponent(query)}&page=${page}&per_page=20`;
    await fetchImages(url);
  }, [fetchImages]);

  const searchImagesAppend = useCallback(async (query: string, page = 1) => {
    setLoading(true);
    try {
      const url = `/api/pexels?query=${encodeURIComponent(query)}&page=${page}&per_page=20`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error!`);
      const data: PexelsResponse = await response.json();

      // MAP AND APPEND
      setImages((prev) => [...prev, ...data.photos.map(mapPexelsToImage)]);

      setTotalResults(data.total_results);
      setCurrentPage(data.page);
      setHasNextPage(!!data.next_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch images");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCuratedImages = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/pexels?page=${page}&per_page=20`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error!`);
      const data: PexelsResponse = await response.json();

      // MAP THE DATA HERE
      setImages(data.photos.map(mapPexelsToImage));

      setTotalResults(data.total_results);
      setCurrentPage(data.page);
      setHasNextPage(!!data.next_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch images");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCuratedImagesAppend = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const url = `/api/pexels?page=${page}&per_page=20`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error!`);
      const data: PexelsResponse = await response.json();

      // MAP AND APPEND
      setImages((prev) => [...prev, ...data.photos.map(mapPexelsToImage)]);

      setTotalResults(data.total_results);
      setCurrentPage(data.page);
      setHasNextPage(!!data.next_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch images");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
    setError(null);
    setTotalResults(0);
    setCurrentPage(1);
    setHasNextPage(false);
  }, []);

  return {
    images,
    loading,
    error,
    totalResults,
    currentPage,
    hasNextPage,
    searchImages,
    loadCuratedImages,
    searchImagesAppend,
    loadCuratedImagesAppend,
    clearImages,
  };
}
