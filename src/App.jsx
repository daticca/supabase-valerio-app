import React, { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDropzone } from "react-dropzone";
import { Camera, Mic, ImagePlus } from "lucide-react"; // icone

// Inserisci qui le tue credenziali Supabase
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
