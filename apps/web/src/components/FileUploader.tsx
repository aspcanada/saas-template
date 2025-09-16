"use client";

import { useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

interface FileUploaderProps {
  onUploadSuccess?: (key: string) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUploader({ onUploadSuccess, onUploadError }: FileUploaderProps) {
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrorMessage("File size too large. Maximum allowed: 5MB");
      setUploadStatus("error");
      onUploadError?.("File size too large");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png", 
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`);
      setUploadStatus("error");
      onUploadError?.("Invalid file type");
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadStatus("idle");
    setErrorMessage(null);

    try {
      const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:4000";
      const token = await getToken();

      // Step 1: Get presigned URL
      const presignResponse = await fetch(`${apiBaseUrl}/attachments/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType: file.type,
          maxSize: file.size,
        }),
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json();
        throw new Error(errorData.error || "Failed to get presigned URL");
      }

      const { url, key } = await presignResponse.json();

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      setUploadedKey(key);
      setUploadStatus("success");
      onUploadSuccess?.(key);
      console.log("File uploaded successfully:", key);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Upload failed";
      setErrorMessage(errorMsg);
      setUploadStatus("error");
      onUploadError?.(errorMsg);
      console.error("Upload error:", errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadStatus("idle");
    setUploadedKey(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          accept="image/*,application/pdf,.txt,.doc,.docx"
        />
        
        {uploadStatus === "idle" && (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Choose File"}
              </button>
              <p className="mt-2 text-sm text-gray-600">
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max file size: 5MB. Supported: Images, PDF, Text, Word docs
              </p>
            </div>
          </div>
        )}

        {uploadStatus === "success" && uploadedKey && (
          <div className="text-green-600">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-green-900">Upload successful!</h3>
            <p className="mt-1 text-sm text-green-700">
              File key: <code className="bg-green-100 px-1 rounded text-xs">{uploadedKey}</code>
            </p>
            <button
              onClick={resetUpload}
              className="mt-3 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Upload Another
            </button>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="text-red-600">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-red-900">Upload failed</h3>
            <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
            <button
              onClick={resetUpload}
              className="mt-3 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
