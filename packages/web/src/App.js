import './App.css';
import Home from './Home';
import HomeAtTime from './HomeAtTime';
import Splash from './Splash';
import Debug from './Debug';
import { withAPI } from './API';
import Typography from '@mui/material/Typography';
import Konami from 'react-konami-code';
import { BrowserRouter as Router, Link, Routes, Route } from "react-router-dom";
import { useState } from 'react';

function App({ api }) {

  const [debug, setDebug] = useState(false);

  const [options, setOptions] = useState({
    showStateInfo: debug,
    showRadius: debug,
    showHistory: debug,
  });

  const setOption = (key, value) => {
    console.log(key, value);
    setOptions({ ...options, [key]: value });
    console.log(options);
  };

  return (
    <Router>
      <div className="app">
        <header>
          <Typography style={{ fontWeight: 500 }} variant="h5" component="h4">
            <span className="accent">whats</span>hovering<span className="accent">over</span>.me
          </Typography>
          <Konami action={() => setDebug(true)}>
            <Debug
              options={options}
              setOption={setOption} />
          </Konami>
        </header>
        <Routes>
          <Route path="/:lat/:lon/:zoom" element={<Home api={api} debug={debug} options={options} setOption={setOption} />} />
          <Route path="/:icao24/:zoom" element={<HomeAtTime api={api} debug={debug} options={options} setOption={setOption} />} />
          <Route path="/" element={<Splash />} />
        </Routes>
        <footer>
          <Typography variant="body1" component="span">By Evan Coleman</Typography>
        </footer>
      </div>
    </Router>
  );
}

export default withAPI(App);
