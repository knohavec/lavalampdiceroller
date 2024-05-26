import React, { useEffect, useState, useRef } from 'react';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import seedrandom from 'seedrandom';

const WebcamDiceRoller: React.FC = () => {
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [diceResult, setDiceResult] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(2000000); // Initial threshold value
  const [delay, setDelay] = useState<number>(1000); // Initial delay value in milliseconds (10 seconds)
  const videoRef = useRef<HTMLVideoElement>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const lastCaptureTimeRef = useRef<number | null>(null);
  const [videoReady, setVideoReady] = useState<boolean>(false);

  const rollDice = (sides: number) => {
    if (randomSeed === 0) {
      console.error('Seed is not set yet');
      return;
    }
    console.log('Using seed:', randomSeed);
    const random = seedrandom(randomSeed.toString());
    const result = Math.floor(random() * sides) + 1;
    console.log(`Rolled d${sides}: ${result}`);
    setDiceResult(`d${sides}: ${result}`);
  };

  const fetchSeedIfNeeded = async () => {
    if (!videoReady) {
      console.log('Video is not ready yet');
      return;
    }

    const currentTime = Date.now();
    const lastCaptureTime = lastCaptureTimeRef.current;

    // Capture a frame only if enough time has passed since the last capture
    if (lastCaptureTime === null || currentTime - lastCaptureTime >= delay) {
      const currentFrame = await captureFrame();
      console.log('Current frame:', currentFrame);
      if (currentFrame && !framesAreSimilar(currentFrame, previousFrameRef.current, threshold)) {
        console.log('Frames are different. Fetching seed...');
        try {
          const response = await fetch('http://localhost:5000/random-seed');
          console.log('Response:', response);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const { seed } = await response.json();
          console.log('Fetched seed from server:', seed);
          setRandomSeed(seed); // Update the state with the fetched seed
        } catch (error) {
          console.error('Error fetching seed from server:', error);
        }
      } else {
        console.log('Frames are similar or current frame is null');
      }
      if (currentFrame) {
        previousFrameRef.current = currentFrame;
        lastCaptureTimeRef.current = currentTime; // Update the last capture time
      }
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !videoReady) return null;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    if (canvas.width === 0 || canvas.height === 0) return null; // Ensure valid dimensions
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return context?.getImageData(0, 0, canvas.width, canvas.height);
  };

  const framesAreSimilar = (frame1: ImageData, frame2: ImageData | null, threshold: number) => {
    if (!frame2) return false;

    const pixels1 = frame1.data;
    const pixels2 = frame2.data;

    let difference = 0;
    for (let i = 0; i < pixels1.length; i += 4) { // Incrementing by 4 since pixel data is RGBA (4 bytes per pixel)
      // Compare each channel (R, G, B, Alpha) separately
      for (let j = 0; j < 3; j++) { // 0 = Red, 1 = Green, 2 = Blue
        difference += Math.abs(pixels1[i + j] - pixels2[i + j]);
      }
    }

    console.log('Difference:', difference, 'Threshold:', threshold);
    return difference < threshold;
  };

  useEffect(() => {
    const intervalId = setInterval(fetchSeedIfNeeded, 2000); // Check every 2 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [videoReady, threshold, delay]); // Add threshold and delay to dependencies

  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setVideoReady(true);
          };
          videoRef.current.onloadeddata = () => {
            setVideoReady(true);
          };
        }
      } catch (error) {
        console.error('Error accessing the webcam:', error);
      }
    };
    getUserMedia();
  }, []);

  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newThreshold = parseInt(event.target.value, 10);
    if (isNaN(newThreshold)) {
      console.error('Invalid threshold value');
      return;
    }
    console.log('New threshold:', newThreshold);
    setThreshold(newThreshold);
  };

  const handleDelayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDelay = parseInt(event.target.value, 10);
    if (isNaN(newDelay)) {
      console.error('Invalid delay value');
      return;
    }
    console.log('New delay:', newDelay);
    setDelay(newDelay);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Webcam Dice Roller</h1>
      <Grid container spacing={2} style={{ marginTop: 20 }}>
        {[4, 6, 8, 10, 12, 20, 100].map(sides => (
          <Grid item key={sides}>
            <Button variant="contained" onClick={() => rollDice(sides)}>Roll d{sides}</Button>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2} style={{ marginTop: 20, alignItems: 'center' }}>
        <Grid item>
          <h3>Current Seed: {randomSeed}</h3>
        </Grid>
        <Grid item>
          {diceResult && <h3>You Rolled: {diceResult}</h3>}
        </Grid>
      </Grid>
      <Grid container spacing={2} style={{ marginTop: 20, alignItems: 'center' }}>
        <Grid item>
          <label htmlFor="threshold">Threshold:</label>
        </Grid>
        <Grid item>
          <input type="number" id="threshold" value={threshold} onChange={handleThresholdChange} />
        </Grid>
      </Grid>
      <Grid container spacing={2} style={{ marginTop: 20, alignItems: 'center' }}>
        <Grid item>
          <label htmlFor="delay">Delay (ms):</label>
        </Grid>
        <Grid item>
          <input type="number" id="delay" value={delay} onChange={handleDelayChange} />
        </Grid>
      </Grid>
      <video ref={videoRef} autoPlay style={{ marginTop: 20, width: '100%' }} />
    </div>
  );
};

export default WebcamDiceRoller;
