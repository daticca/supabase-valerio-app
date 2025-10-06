import React, { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDropzone } from "react-dropzone";

// Inserisci qui le tue credenziali Supabase
const supabaseUrl = "https://wkegigbnhuiucdzqqnhr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZWdpZ2JuaHVpdWNkenFxbmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzk5NDEsImV4cCI6MjA3NTM1NTk0MX0.Ywbk-MnA0WDb6jKBQEb8O0_iTKSi8Ezvs59dot_ZohQ";
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
      acceptedFiles.forEach(file => {
        setPreview(prev => [...prev, URL.createObjectURL(file)]);
      });
    },
  });

  // Funzione per upload su Supabase
  const uploadFile = async (file) => {
    const filename = `${Date.now()}_${file.name || "media.webm"}`;
    const { data, error } = await supabase.storage.from("valerio-uploads").upload(filename, file);
    if (error) {
      console.log("Upload error:", error);
      return;
    }
    const url = supabase.storage.from("valerio-uploads").getPublicUrl(filename).data.publicUrl;
    console.log("File uploaded:", url);

    // Salva metadati nel database
    await supabase.from("files").insert([
      { filename: filename, url: url, type: file.type }
    ]);

    setPreview(prev => [...prev, url]);
  };

  // Avvia registrazione video/audio
  const startRecording = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(mediaStream);
    videoRef.current.srcObject = mediaStream;
    const recorder = new MediaRecorder(mediaStream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => setChunks(prev => [...prev, e.data]);
    recorder.start();
    setRecording(true);
  };

  // Ferma registrazione e upload
  const stopRecording = async () => {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setChunks([]);
      await uploadFile(blob);
    };
    stream.getTracks().forEach(track => track.stop());
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
      mediaStream.getTracks().forEach(track => track.stop());
    }, "image/jpeg");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Upload e Registrazione Web</h1>

      {/* Drag & Drop */}
      <div {...getRootProps()} className="border p-4 mb-4">
        <input {...getInputProps()} />
        <p>Trascina i file qui o clicca per selezionare</p>
      </div>
      <button onClick={() => files.forEach(uploadFile)} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">
        Upload Selezionati
      </button>

      {/* Live video */}
      <div className="mb-4">
        <video ref={videoRef} autoPlay muted className="w-64 h-48 border mb-2"></video>
        {!recording ? (
          <button onClick={startRecording} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Start Recording</button>
        ) : (
          <button onClick={stopRecording} className="bg-red-500 text-white px-4 py-2 rounded mr-2">Stop Recording</button>
        )}
        <button onClick={takePhoto} className="bg-yellow-500 text-white px-4 py-2 rounded">Scatta Selfie</button>
      </div>

      {/* Anteprima file */}
      <div className="flex flex-wrap gap-2">
        {preview.map((url, idx) => (
          <video key={idx} src={url} controls className="w-32 h-24 border"></video>
        ))}
      </div>
    </div>
  );
}
