import React, { useState, useEffect } from 'react';
import './css/UxTester.css';

import wat1 from './images/1.png';
import wat2 from './images/2.jpg';
import wat3 from './images/3.png';
import wat4 from './images/4.jpg';
import wat5 from './images/5.jpg';

const images = [wat1, wat2, wat3, wat4, wat5];


const regionNames = ['ภาคเหนือ', 'ภาคใต้', 'ภาคตะวันออก', 'ภาคตะวันตก', 'ภาคกลาง'];

function UxTester() {
  const [columns, setColumns] = useState(3);
  const [autoPlay, setAutoPlay] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [fadeState, setFadeState] = useState(Array(columns).fill('fade-enter'));

  useEffect(() => {
    setFadeState(Array(columns).fill('fade-exit'));

    const timeout = setTimeout(() => {
      setFadeState(Array(columns).fill('fade-enter'));
    }, 200);

    return () => clearTimeout(timeout);
  }, [currentIndex, columns]);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay]);

  const displayedImages = Array(columns)
    .fill(0)
    .map((_, colIdx) => images[(currentIndex + colIdx) % images.length]);

  const handleBulletClick = (idx) => {
    setCurrentIndex(idx);
  };

  return (
    <div id="temple" className="templeall">
      <div className="header-container">
        <h1 className="main-title">TEMPLE BY REGION</h1>
        <p className="sub-title">ค้นหาข้อมูลวัดตามภูมิภาค</p>

        <div className="controls">
          <label>
            จำนวนคอลัมน์:
            <select value={columns} onChange={(e) => setColumns(Number(e.target.value))}>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <label style={{ marginLeft: '1rem' }}>
            <input type="checkbox" checked={autoPlay} onChange={() => setAutoPlay(!autoPlay)} />
            Auto Play
          </label>
        </div>

        <div className="wat">
          {displayedImages.map((src, idx) => (
            <div key={idx} className="item">
              <img
                key={`${currentIndex}-${idx}`}
                src={src}
                alt={`Wat col ${idx + 1}`}
                className={fadeState[idx]}
              />

              <div className="image-label">
                {regionNames[(currentIndex + idx) % regionNames.length]}
              </div>
            </div>
          ))}
        </div>

        <div className="bullet-container">
          {images.map((_, idx) => (
            <span
              key={idx}
              onClick={() => handleBulletClick(idx)}
              className={`bullet ${idx === currentIndex ? 'active' : ''}`}
              title={`รูปที่ ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default UxTester;
