import { useState } from 'react'
import logoDark from './assets/logDark.png'
import { Routes, Route } from 'react-router-dom'
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
          <input type="number" placeholder='Código da empresa' id='codigo' className='codigo'/>
          <input type="number" placeholder='Numero de Matricula' id='matricula' className='codigo'/>
          <input type="password" placeholder='Senha Pessoal' id='senha' className='codigo'/>

          <button type='submit' className='botao'>Confirmar</button>
        </div>
      </section>
    </>
    
  )
}

export default App
