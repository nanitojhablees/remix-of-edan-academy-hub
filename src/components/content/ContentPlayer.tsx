import { useMemo } from "react";

interface ContentPlayerProps {
  videoUrl?: string | null;
  content?: string | null;
  title?: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

function isGoogleSlidesUrl(url: string): boolean {
  return url.includes("docs.google.com/presentation");
}

function isPresentationUrl(url: string): boolean {
  return /\.(pptx?|odp)(\?|$)/i.test(url) || isGoogleSlidesUrl(url);
}

function getGoogleSlidesEmbedUrl(url: string): string {
  // Convert share URL to embed URL
  return url.replace(/\/pub\??.*$/, "/embed").replace(/\/edit\??.*$/, "/embed");
}

export function VideoPlayer({ url, title }: { url: string; title?: string }) {
  const embedUrl = useMemo(() => {
    const yt = getYouTubeEmbedUrl(url);
    if (yt) return { type: "iframe" as const, src: yt };
    
    const vim = getVimeoEmbedUrl(url);
    if (vim) return { type: "iframe" as const, src: vim };
    
    if (isDirectVideo(url)) return { type: "video" as const, src: url };
    
    // Fallback: try as iframe
    return { type: "iframe" as const, src: url };
  }, [url]);

  if (embedUrl.type === "video") {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video className="w-full h-full" controls src={embedUrl.src}>
          Tu navegador no soporta el elemento de video.
        </video>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        className="w-full h-full"
        src={embedUrl.src}
        title={title || "Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export function PdfViewer({ url, title }: { url: string; title?: string }) {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-border">
      <iframe
        className="w-full"
        style={{ height: "600px" }}
        src={`${url}#toolbar=1&navpanes=1`}
        title={title || "PDF Document"}
      />
    </div>
  );
}

export function PresentationViewer({ url, title }: { url: string; title?: string }) {
  const embedSrc = useMemo(() => {
    if (isGoogleSlidesUrl(url)) return getGoogleSlidesEmbedUrl(url);
    // Use Office Online viewer for pptx files
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }, [url]);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border">
      <iframe
        className="w-full"
        style={{ height: "500px" }}
        src={embedSrc}
        title={title || "Presentación"}
        allowFullScreen
      />
    </div>
  );
}

export function ContentPlayer({ videoUrl, content, title }: ContentPlayerProps) {
  // Determine primary media type from videoUrl
  const mediaType = useMemo(() => {
    if (!videoUrl) return null;
    if (isPdfUrl(videoUrl)) return "pdf";
    if (isPresentationUrl(videoUrl)) return "presentation";
    return "video";
  }, [videoUrl]);

  return (
    <div className="space-y-6">
      {videoUrl && mediaType === "video" && (
        <VideoPlayer url={videoUrl} title={title} />
      )}
      {videoUrl && mediaType === "pdf" && (
        <PdfViewer url={videoUrl} title={title} />
      )}
      {videoUrl && mediaType === "presentation" && (
        <PresentationViewer url={videoUrl} title={title} />
      )}
    </div>
  );
}
