import { useState } from 'react'
import plantaeLogo from '/plantae-logo.png'

import './App.css'
import Plant from './components/Plant'
import AddPlant from './components/AddPlant'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <h1>Plantae</h1>
      <img src={plantaeLogo} className="logo" alt="Plantae logo" />
      <Plant />
      <Plant />
      <AddPlant />
    </>
  )
}

export default App
