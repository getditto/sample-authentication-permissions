import React, { useState, useEffect  } from "react";
import './App.css';
import DittoManager from "./ditto"
import { Ditto } from "@dittolive/ditto";

let ditto: Ditto
function App() {
  const [cars, setCars] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    async function startDitto() {
      ditto = DittoManager()
      ditto.store.registerObserver(`
        SELECT *
        FROM cars`,
        (result) => {
          setCars(result.items.length)
        })
    }
    startDitto()
  }, []);

  function onAddClick (){
    if (!ditto) return setError('No ditto.')
    setError('')
    ditto.store.collection('cars').upsert({
      "name": 'Toyota'
    })
  }

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h3>
          {cars} cars
          </h3>
          {error && <p style={{"color": "red"}}>{error}</p>}
          <button onClick={onAddClick}>+</button>
        </div>
      </header>
    </div>
  );
}

export default App;
