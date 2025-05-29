// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Form from './features/page/Form';
import UxTester from './features/page/UxTester';
import HomePage from './features/page/Homepage';
import './features/page/css/UxTester.css';


function App() {
  return (
    <Router>
      <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
        <nav style={{ marginBottom: '2rem' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>หน้าหลัก</Link>
          <Link to="/form" style={{ marginRight: '1rem' }}>Form</Link>
          <Link to="/ux-tester">UxTester</Link>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/form" element={<Form />} />
          <Route path="/ux-tester" element={<UxTester />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
