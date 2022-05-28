import './App.css';
import Home from './Home';
import HomeAtTime from './HomeAtTime';
import Debug from './Debug';
import { withAPI } from './API';
import Konami from 'react-konami-code';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from 'react';

function App({ api }) {

  const [options, setOptions] = useState({
    showStateInfo: false,
    showRadius: false,
    showHistory: false,
  });

  const setOption = (key, value) => {
    console.log(key, value);
    if (value === null) {
      setOptions(options => {
        delete options[key];
        return options;
      })
    } else {
      setOptions({ ...options, [key]: value });
    }
    console.log(options);
  };

  return (
    <Router>
      <div className="app">
        <header className="fs-4">
          <span className="accent">whats</span>hovering<span className="accent">over</span>.me
          <Debug
            options={options}
            setOption={setOption} />
        </header>
        <Routes>
          <Route path="/:lat/:lon/:zoom" element={<Home api={api} options={options} setOption={setOption} />} />
          <Route path="/:icao24/:zoom" element={<HomeAtTime api={api} options={options} setOption={setOption} />} />
          <Route path="/" element={<Home api={api} options={options} setOption={setOption} />} />
        </Routes>
        {/* <footer>
          <Typography variant="body1" component="span">By Evan Coleman</Typography>
        </footer> */}
      </div>
    </Router>
  );
}

export default withAPI(App);
