import { useState } from "react";
import Navbar from "../components/Navbar";
import { homeLinks } from "../data/navLinks";

function Home() {

  return (
    <>
      <Navbar links={homeLinks} />
      <main>
        <h1>Página Home</h1>
      </main>
    </>
  );
}

export default Home;