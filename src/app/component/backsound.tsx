'use client'
import React, { useEffect, useRef } from 'react';

const Backsound = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const startAudio = async () => {
      if (audioRef && audioRef.current) {
        try {
          await audioRef.current.play();
          audioRef.current.loop = true;
          audioRef.current.volume = 0.5;
        } catch (error) {
          console.log("Autoplay was prevented.");
          // Handle the error or prompt the user to interact with the page
        }
      }
    };

    // Function to handle user interaction
    const handleInteraction = () => {
      startAudio();
      // Remove the event listener to prevent multiple starts
      document.removeEventListener("click", handleInteraction);
    };

    // Add event listener to start audio on user interaction
    document.addEventListener("click", handleInteraction);

    // Clean up function
    return () => {
      document.removeEventListener("click", handleInteraction);
    };
  }, []);

  return (
    <audio ref={audioRef} src="/backsound/backsound.mp3" />
  );
};

export default Backsound;
