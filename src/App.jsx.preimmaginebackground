import React, { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDropzone } from "react-dropzone";
import { Camera, Mic, ImagePlus } from "lucide-react";
import valerioPhoto from "./assets/valerio.jpeg";

// Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [recording, setRecording] = useState(false);
  const [chunks, setChunks] = useState([]);
  const videoRef = useRef();
  const mediaRecorderRef = useRef();
  const [stream, setStream] = useState(null);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setFiles(acceptedFiles);
      acceptedFiles.forEach((file) => {
        setPreview((prev) => [...prev, URL.createObjectURL(file)]);
      });
    },
  });

  const uploadFile = async (file) => {
    const filename = `${Date.now()}_${file.name || "media.webm"}`;
    const { data, error } = await supabase.storage
      .from("valerio-uploads")
      .upload(filename, file);
    if (error) {
      console.log("Upload error:", error);
      return;
    }
    const url = supabase.storage
      .from("valerio-uploads")
      .getPublicUrl(filename).data.publicUrl;

    await supabase.from("files").insert([{ filename, url, type: file.type }]);
    setPreview((prev) => [...prev, url]);
  };

  const startRecording = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setStream(mediaStream);
    videoRef.current.srcObject = mediaStream;
    const recorder = new MediaRecorder(mediaStream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => setChunks((prev) => [...prev, e.data]);
    recorder.start();
    setRecording(true);
  };

  const stopRecording = async () => {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setChunks([]);
      await uploadFile(blob);
    };
    stream.getTracks().forEach((track) => track.stop());
    setRecording(false);
  };

  const takePhoto = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement("video");
    video.srcObject = mediaStream;
    await video.play();
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      await uploadFile(blob);
      mediaStream.getTracks().forEach((track) => track.stop());
    }, "image/jpeg");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 p-6">
      {/* Titolo in frame */}
      <div className="bg-blue-600 text-white p-4 rounded shadow mb-6 text-center">
        <h1 className="text-3xl font-bold">Upload e Registrazione Web</h1>
      </div>

      {/* Pulsanti grandi affiancati / responsive */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {/* Drag & drop / scegli file */}
        <button
          {...getRootProps()}
          className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-6 py-4 rounded-lg flex items-center gap-2 hover:from-blue-500 hover:to-blue-700 transition w-full sm:w-auto justify-center"
        >
          <ImagePlus className="w-6 h-6" /> Scegli File
          <input {...getInputProps()} />
        </button>

        {/* Selfie */}
        <button
          onClick={takePhoto}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-4 rounded-lg flex items-center gap-2 hover:from-yellow-500 hover:to-yellow-600 transition w-full sm:w-auto justify-center"
        >
          <Camera className="w-6 h-6" /> Scatta Selfie
        </button>

        {/* Registrazione audio/video */}
        {!recording ? (
          <button
            onClick={startRecording}
            className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-4 rounded-lg flex items-center gap-2 hover:from-green-500 hover:to-green-700 transition w-full sm:w-auto justify-center"
          >
            <Mic className="w-6 h-6" /> Registra
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-gradient-to-r from-red-400 to-red-600 text-white px-6 py-4 rounded-lg flex items-center gap-2 hover:from-red-500 hover:to-red-700 transition w-full sm:w-auto justify-center"
          >
            <Mic className="w-6 h-6" /> Stop
          </button>
        )}
      </div>

      {/* Foto */}
      <div className="flex justify-center mb-6">
        <img
          src={valerioPhoto}
          alt="Valerio"
          className="w-48 h-48 object-cover rounded-full shadow-lg"
        />
      </div>

      {/* Anteprime file responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {preview.map((url, idx) => {
          if (url.endsWith(".mp4") || url.endsWith(".webm")) {
            return (
              <video
                key={idx}
                src={url}
                controls
                className="w-full h-32 object-cover rounded shadow-sm"
              ></video>
            );
          } else {
            return (
              <img
                key={idx}
                src={url}
                alt="preview"
                className="w-full h-32 object-cover rounded shadow-sm"
              />
            );
          }
        })}
      </div>
    </div>
  );
}
