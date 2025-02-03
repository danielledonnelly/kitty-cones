import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import { motion, AnimatePresence } from "motion/react";
import music from "/assets/music.mp3";
import { IconButton } from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import MusicOffIcon from "@mui/icons-material/MusicOff";

// Arrays of cone and scoop images
// NOTE TO SELF: May change the variables below from labeled to numbered so that they match the naming convention of customer images
const cones = [
  "light-cone.png",
  "dark-cone.png",
  "light-cake-cone.png",
  "dark-cake-cone.png",
];
const scoops = [
  "vanilla-scoop.png",
  "chocolate-scoop.png",
  "strawberry-scoop.png",
  "blueberry-scoop.png",
];

// Function to generate randomized customer orders
const generateCustomerOrders = (cones, scoops, customerImages) => {
  return customerImages.map(() => {
    const randomCone = cones[Math.floor(Math.random() * cones.length)]; // Randomly select a cone from the array
    const scoopCount = Math.floor(Math.random() * 3) + 1; // Randomly determine the number of scoops (1 to 3)
    const randomScoops = Array.from(
      { length: scoopCount },
      () => scoops[Math.floor(Math.random() * scoops.length)] // Create an array of randomly selected scoops (up to the scoop count)
    );
    return { cone: randomCone, scoops: randomScoops }; // Return an order object with the selected cone and scoops
  });
};

function App() {
  // Screens and selected variables
  const [showStartScreen, setShowStartScreen] = useState(true); // State to control whether the start screen is visible

  const [showEndScreen, setShowEndScreen] = useState(false); // State to control whether the end screen is visible

  const [isMusicEnabled, setIsMusicEnabled] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2;
      if (isMusicEnabled) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicEnabled]);

  const [selectedCone, setSelectedCone] = useState(null); // State to track which cone the player selects.

  const [selectedScoops, setSelectedScoops] = useState([]); // State to track the scoops the player selects.

  const [customerImages, setCustomerImages] = useState(
    // State to hold a list of customer images
    Array.from({ length: 3 }, (_, i) => `customer${i + 1}.svg`)
  );

  const [nextCustomerId, setNextCustomerId] = useState(4);

  // STATISTICS
  const [coins, setCoins] = useState(0); // State to track the player's coins

  const [time, setTime] = useState(60); // State to track the remaining time

  const [highScores, setHighScores] = useState(() => {
    // State to hold high scores, initialized by reading from localStorage
    try {
      const savedScores = localStorage.getItem("highScores"); // Try to retrieve saved scores from localStorage
      return savedScores ? JSON.parse(savedScores) : []; // If scores exist, parse and use them; otherwise, initialize with an empty array
    } catch (error) {
      console.error("Error reading from localStorage:", error); // Log any errors that occur while accessing localStorage.
      return []; // Default to an empty array if an error occurs
    }
  });

  const [customerOrders, setCustomerOrders] = useState(() =>
    // State for managing customer orders
    generateCustomerOrders(
      cones,
      scoops,
      Array.from({ length: 3 }, (_, i) => `customer${i + 1}.svg`)
    )
  );

  useEffect(() => {
    if (!showStartScreen) {
      const timer = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleGameEnd();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
  
      return () => clearInterval(timer);
    }
  }, [showStartScreen]);  

  // ASSEMBLING AND SERVING ICE CREAM CONE LOGIC
  const handleConeClick = (cone) => {
    // Function for selecting a cone
    setSelectedCone(cone);
  };

  const handleScoopClick = (scoop) => {
    // Function for selecting scoops
    setSelectedScoops((prevScoops) => [...prevScoops, scoop]);
  };

  const handleOrderClick = (customerOrder, customerIndex) => {
    if (!selectedCone || selectedScoops.length === 0) {
      return;
    }

    const isConeMatch = customerOrder.cone === selectedCone;
    const isScoopsMatch =
      customerOrder.scoops.length === selectedScoops.length &&
      customerOrder.scoops.every(
        (scoop, index) => scoop === selectedScoops[index]
      );

    if (isConeMatch && isScoopsMatch) {
      // Increment coins
      setCoins((prevCoins) => prevCoins + 15);

      // Update customer images
      setCustomerImages((prevImages) => {
        const updatedImages = [...prevImages];
        updatedImages.splice(customerIndex, 1); // Remove served customer

        // Find the next customer that is not already on screen
        let nextCustomer = `customer${nextCustomerId}.svg`;
        let currentId = nextCustomerId;

        while (updatedImages.includes(nextCustomer)) {
          currentId = currentId + 1 > 10 ? 1 : currentId + 1; // Cycle back to 1 after reaching 10
          nextCustomer = `customer${currentId}.svg`;
        }

        updatedImages.push(nextCustomer); // Add the next customer
        setNextCustomerId(currentId + 1 > 10 ? 1 : currentId + 1); // Update nextCustomerId

        return updatedImages;
      });

      // Update customer orders
      setCustomerOrders((prevOrders) => {
        const updatedOrders = [...prevOrders];
        updatedOrders.splice(customerIndex, 1); // Remove served order
        const newOrder = generateCustomerOrders(cones, scoops, [
          `customer${nextCustomerId}.svg`,
        ])[0];
        updatedOrders.push(newOrder); // Add new order
        return updatedOrders;
      });

      // Clear the assembled ice cream
      setSelectedCone(null);
      setSelectedScoops([]);
    } else {
      // Decrement coins for incorrect order
      setCoins((prevCoins) => Math.max(0, prevCoins - 5));
    }
  };

  // RESTART LOGIC
  const handleRestart = () => {
    setSelectedCone(null);
    setSelectedScoops([]);
    setTime(60); // Reset the timer
    setCoins(0); // Reset coins
    setShowEndScreen(false); // Hide the end screen
    setNextCustomerId(4); // Reset next customer ID
    setCustomerOrders(
      generateCustomerOrders(
        cones,
        scoops,
        Array.from({ length: 3 }, (_, i) => `customer${i + 1}.svg`)
      )
    ); // Regenerate customer orders
    setCustomerImages(
      Array.from({ length: 3 }, (_, i) => `customer${i + 1}.svg`)
    ); // Reset customer images
  };

  const handleGameEnd = () => {
    console.log("handleGameEnd called"); // Debugging
    console.log("Final Coins at Game End:", coins); // Debugging
    updateHighScores(coins); // Save the current score
    setShowEndScreen(true); // Show end screen
  };

  const updateHighScores = (currentScore) => {
    const updatedScores = [...highScores, currentScore]
      .filter((score) => score > 0) // Ignore invalid scores
      .sort((a, b) => b - a) // Sort descending
      .slice(0, 10); // Top 10 scores

    setHighScores(updatedScores);
    try {
      const scoresString = JSON.stringify(updatedScores);
      if (scoresString) {
        localStorage.setItem("highScores", scoresString);
        console.log("Updated High Scores:", updatedScores); // Debugging
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // MOBILE WARNING
  const [showMobileWarning, setShowMobileWarning] = useState(
    window.innerWidth < 1200
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && !showMobileWarning) {
        setShowMobileWarning(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [showMobileWarning]);

  return (
    <div
      className={`app-container ${
        showStartScreen || showEndScreen ? "disable-buttons" : ""
      }`}
    >
      {/* Mobile Warning */}
      {showMobileWarning && (
        <div className="mobile screen">
          <h1 className="mobile screen-title">WARNING</h1>
          <p className="mobile screen-text">
            Kitty Cones is not optimized for this screen size! Please play on a
            larger screen.
          </p>
          {/* <button    this will be enabled when the game is mobile responsive 
            className="mobile screen-button"
            onClick={() => setShowMobileWarning(false)}
          >
            OK
          </button> */}
        </div>
      )}

      {/* Starting Screen */}
      {showStartScreen && (
        <div className="starting screen">
          <h1 className="starting screen-title">KITTY CONES</h1>
          <p className="starting screen-text">
            Serve ice cream to hungry kitties by clicking on the ingredients and
            then clicking the order bubble. Serve customers as fast as possible
            and keep the line moving to get more coins!
          </p>
          <button
            className="starting screen-button"
            onClick={() => {
              setShowStartScreen(false);
              if (backgroundMusic.paused) {
                backgroundMusic.play().catch((error) => {
                  console.warn("Music playback failed", error);
                });
              }
            }}
          >
            Start
          </button>
        </div>
      )}

      {/* Coin Counter */}
      <div className="coin-counter">Coins: {coins}</div>

      {/* Music */}
      <audio ref={audioRef} loop autoPlay muted={!isMusicEnabled}>
        <source src={music} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Music Toggle Button */}
      <IconButton
        className="icon"
        sx={{
          position: "fixed",
          top: "15px",
          right: "130px",
          zIndex: 3,
          color: isMusicEnabled ? "white" : "grey",
        }}
        onClick={() => setIsMusicEnabled(!isMusicEnabled)}
      >
        {isMusicEnabled ? <MusicNoteIcon /> : <MusicOffIcon />}
      </IconButton>

      {/* Timer */}
      <div className="timer">Time: {time}</div>

      {/* Background Layer */}
      <img
        src="/assets/background.png"
        alt="Background"
        className="background"
      />

      {/* Customers Layer */}
      <AnimatePresence>
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            left: 0,
            width: "100%",
            display: "flex",
            justifyContent: "space-evenly",
            zIndex: 2,
          }}
        >
          {customerImages.slice(0, 3).map((customer, index) => (
            <motion.div
              key={customer} // Unique identifier
              layout
              className="customer"
              initial={{ opacity: 0, x: 50 }} // Start offscreen to the right
              animate={{ opacity: 1, x: 0 }} // Move to the correct position
              exit={{ opacity: 0, x: -50 }} // Exit to the left
              transition={{ duration: 0.7 }} // Animation speed
            >
              {/* Ice Cream Order */}
              <div
                className="order"
                onClick={() => handleOrderClick(customerOrders[index], index)}
              >
                {/* Cone */}
                {customerOrders[index]?.cone && (
                  <img
                    className="cone-order"
                    src={`/assets/${customerOrders[index].cone}`}
                    alt="Cone"
                  />
                )}
                {/* Scoops */}
                {customerOrders[index]?.scoops.map((scoop, scoopIndex) => (
                  <img
                    key={scoopIndex}
                    className="scoop-order"
                    src={`/assets/${scoop}`}
                    alt={`Scoop ${scoopIndex + 1}`}
                    style={{
                      "--scoop-index": scoopIndex,
                    }}
                  />
                ))}
              </div>

              {/* Customer Image */}
              <img
                className="customer-image"
                src={`/assets/${customer}`}
                alt={`Customer ${index + 1}`}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Counter */}
      <div className="counter">
        {/* Assembled Ice Cream */}
        <div className="ice-cream">
          {selectedCone && (
            <img
              src={`/assets/${selectedCone}`}
              alt="Selected Cone"
              className="ice-cream-cone"
            />
          )}
          {selectedScoops.map((scoop, index) => (
            <img
              key={index}
              src={`/assets/${scoop}`}
              alt={`Scoop ${index + 1}`}
              className="ice-cream-scoop"
              style={{ bottom: `${210 + index * 50}px` }}
            />
          ))}
        </div>

        {/* Buttons for Cones */}
        <div className="buttons-group cone-buttons">
          {cones.map((cone) => (
            <button
              key={cone}
              onClick={() => handleConeClick(cone)}
              className="button"
            >
              <img src={`/assets/${cone}`} alt={cone} />
            </button>
          ))}
        </div>

        {/* Buttons for Scoops */}
        <div className="buttons-group scoop-buttons">
          {scoops.map((scoop) => (
            <button
              key={scoop}
              onClick={() => handleScoopClick(scoop)}
              className="button"
            >
              <img src={`/assets/${scoop}`} alt={scoop} />
            </button>
          ))}
        </div>

        {/* Order Reset Button */}
        <div className="restart-button">
          <button
            onClick={() => {
              setSelectedCone(null); // Clear the selected cone
              setSelectedScoops([]); // Clear the selected scoops
            }}
            className="button"
          >
            <img src="/assets/restart.png" alt="Reset Order" />
          </button>
        </div>
      </div>

      {/* High Scores */}
      {showEndScreen && (
        <div className="end screen">
          <h1 className="end screen-title">Game Over</h1>
          <p className="end screen-text">Your Score: {coins}</p>
          <h2 className="end screen-title">High Scores</h2>
          <div className="high-scores">
            {highScores.map((score, index) => (
              <div key={index} className="high-score-item">
                {index + 1}. {score}
              </div>
            ))}
            <br/><br/><br/>
          </div>
          <button className="end screen-button" onClick={handleRestart}>
            Restart
          </button>
        </div>
      )}
    </div>
  );
}

export default App;