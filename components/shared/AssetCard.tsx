"use client";

import NextImage from "next/image";
import { FileText, Download, ExternalLink, AlertCircle, CheckCircle, Clock } from "lucide-react";

export interface AssetCardProps {
  title: string;
  status: "ready" | "pending" | "missing" | "exception";
  thumbnail?: string;
  openLink?: string;
  openLabel?: string;
  downloadLink?: string;
  relatedEntity?: {
    type: "load" | "driver" | "settlement" | "safety-event";
    id: string;
    name: string;
  };
  description?: string;
  fileSize?: string;
  lastUpdated?: string;
}

export function AssetCard({
  title,
  status,
  thumbnail,
  openLink,
  openLabel,
  downloadLink,
  relatedEntity,
  description,
  fileSize,
  lastUpdated,
}: AssetCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "exception":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "missing":
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadgeClass = () => {
    switch (status) {
      case "ready":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "exception":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "missing":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "ready":
        return "Ready";
      case "pending":
        return "Pending";
      case "exception":
        return "Exception";
      case "missing":
        return "Missing";
      default:
        return "Unknown";
    }
  };
  const isSvgThumbnail = thumbnail?.toLowerCase().endsWith(".svg") ?? false;

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h4 className="text-sm font-medium text-white">{title}</h4>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Thumbnail/Preview */}
      {thumbnail && (
        <div className="mb-3 rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700">
          <NextImage
            src={thumbnail}
            alt={`${title} preview`}
            width={320}
            height={160}
            unoptimized={isSvgThumbnail}
            className="h-32 w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{description}</p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        {fileSize && <span>{fileSize}</span>}
        {lastUpdated && <span>{lastUpdated}</span>}
      </div>

      {/* Related Entity */}
      {relatedEntity && (
        <div className="mb-3">
          <span className="text-xs text-slate-400">Related: </span>
          <span className="text-xs text-slate-300">
            {relatedEntity.type === "load" && "Load "}
            {relatedEntity.type === "driver" && "Driver "}
            {relatedEntity.type === "settlement" && "Settlement "}
            {relatedEntity.type === "safety-event" && "Safety Event "}
            {relatedEntity.name}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {openLink && (
          <a
            href={openLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            {openLabel ?? "Open"}
          </a>
        )}
        {downloadLink && (
          <a
            href={downloadLink}
            download
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium"
          >
            <Download className="w-3 h-3" />
            Download
          </a>
        )}
      </div>
    </div>
  );
}
