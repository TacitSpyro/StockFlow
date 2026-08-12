import { useState } from 'react'
import logoDark from './assets/logDark.png'
import './App.css'

function App() {

  return (
    <>
      <section id="center">
        <div className="Login">
          <img src={logoDark} className="Logo" width="170" height="179" alt="" />
        </div>
        <div className='container' id='loginDiv'>
          <label>Iniciar Gerenciamento</label>
          <input type="number" placeholder='Código da empresa' id='codigo'/>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
