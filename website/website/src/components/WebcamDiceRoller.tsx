import React, { useEffect, useState, useRef } from 'react';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import seedrandom from 'seedrandom';

const WebcamDiceRoller: React.FC = () => {
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [diceResult, setDiceResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const fetchSeed = async () => {
    try {
      console.log('Fetching seed from server...');
      const response = await fetch('http://localhost:5000/random-seed');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { seed } = await response.json();
      console.log('Fetched seed from server:', seed);
      setRandomSeed(seed);
    } catch (error) {
      console.error('Error fetching seed from server:', error);
    }
  };

  useEffect(() => {
    fetchSeed(); // Initial fetch
    const intervalId = setInterval(fetchSeed, 5000); // Fetch seed every 5 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing the webcam:', error);
      }
    };
    getUserMedia();
  }, []);

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
      <video ref={videoRef} autoPlay style={{ marginTop: 20, width: '100%' }} />
    </div>
  );
};

export default WebcamDiceRoller;
