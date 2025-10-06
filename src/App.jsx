import React, { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDropzone } from "react-dropzone";
import { Camera, Mic, ImagePlus } from "lucide-react";

// Supabase client con variabili d'ambiente
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

  // Drag & drop dei file
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setFiles(acceptedFiles);
      acceptedFiles.forEach((file) => {
        setPreview((prev) => [...prev, URL.createObjectURL(file)]);
      });
    },
  });

  // Upload su Supabase
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

    // Salva metadati nel database
    await supabase.from("files").insert([{ filename, url, type: file.type }]);

    setPreview((prev) => [...prev, url]);
  };

  // Registrazione audio/video
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

  // Scatta selfie
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Upload e Registrazione Web</h1>

      {/* Drag & Drop */}
      <div
        {...getRootProps()}
        className="border p-4 mb-4 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition rounded"
      >
        <input {...getInputProps()} />
        <ImagePlus className="w-6 h-6 mr-2 text-blue-500" />
        <p>Trascina i file qui o clicca per selezionare</p>
      </div>

      <button
        onClick={() => files.forEach(uploadFile)}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded flex items-center hover:bg-blue-600 transition"
      >
        <ImagePlus className="w-5 h-5 mr-2" /> Upload Selezionati
      </button>

      {/* Live video / registrazione */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-64 h-48 border mb-2 rounded"
        ></video>

        {!recording ? (
          <button
            onClick={startRecording}
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center mr-2 hover:bg-green-600 transition"
          >
            <Mic className="w-5 h-5 mr-2" /> Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-500 text-white px-4 py-2 rounded flex items-center mr-2 hover:bg-red-600 transition"
          >
            <Mic className="w-5 h-5 mr-2" /> Stop Recording
          </button>
        )}

        <button
          onClick={takePhoto}
          className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center hover:bg-yellow-600 transition"
        >
          <Camera className="w-5 h-5 mr-2" /> Scatta Selfie
        </button>
      </div>

      {/* Anteprime file */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {preview.map((url, idx) => {
          // Mostra video se tipo video, altrimenti immagine
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
