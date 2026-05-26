import React, { useState, useEffect } from "react";
import config from "./data/config.json";
import { useBackground } from "./hooks/useBackground";
import { DAYS, TASKS as initialTasks } from "./hooks/useSchedule";
import "./styles/App.css";

const ALL_TASK_OPTIONS = [
  "กวาดพื้น",
  "เช็ดกระจก",
  "จัดโต๊ะ",
  "ถูพื้น",
  "เก็บขยะ",
  "กระจก/โต๊ะ",
  "กระจก/จัดโต๊ะ",
  "เก็บขยะ/กระดาน"
]; // Add more if needed from initialTasks

export default function Dashboard({ className, dataset }) {
  const displayClass = className.replace('-', '/');
  const [isEditing, setIsEditing] = useState(false);
  const [tasks, setTasks] = useState([...initialTasks]);
  const [slots, setSlots] = useState([...(dataset.slots || [])]);

  // Ensure slots length is correct (DAYS * tasks.length)
  useEffect(() => {
    const needed = DAYS.length * tasks.length;
    if (slots.length < needed) {
      setSlots([...slots, ...Array(needed - slots.length).fill("")]);
    } else if (slots.length > needed) {
      setSlots(slots.slice(0, needed));
    }
  }, [tasks]);

  const {
    clickCount,
    showAdmin,
    showPasswordPrompt,
    password,
    setPassword,
    backgroundImage,
    showUI,
    setShowUI,
    fadeIn,
    imageUrl,
    setImageUrl,
    previewImage,
    handleGlobalClick,
    handlePasswordSubmit,
    handlePasswordCancel,
    handlePreviewUrl,
    handleSetBackground,
    handleResetBackground,
    handleImageUpload,
    handleCloseAdmin,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    backgroundStyle,
    previewStyle,
  } = useBackground(config);

  const handleTaskChange = (idx, value) => {
    const newTasks = [...tasks];
    newTasks[idx] = value;
    setTasks(newTasks);
  };

  const handleSlotChange = (dayIdx, colIdx, value) => {
    const newSlots = [...slots];
    newSlots[dayIdx * tasks.length + colIdx] = value;
    setSlots(newSlots);
  };

  // Convert flat slots to grid for rendering
  const grid = [];
  for (let r = 0; r < DAYS.length; r++) {
    const start = r * tasks.length;
    const row = slots.slice(start, start + tasks.length);
    grid.push(row);
  }

  return (
    <div className="app-root" style={backgroundStyle} onClick={handleGlobalClick}>
      <div 
        className={`app-card${backgroundImage && fadeIn ? ' fade-in' : ''}${!showUI ? ' hidden' : ''}`} 
        style={{ background: backgroundImage ? 'rgba(255, 255, 255, 0)' : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="app-header">
          <h1>ตารางเวร {displayClass} (Dashboard)</h1>
          <p className="subtitle">
            By Kimza :DDD
          </p>
        </header>

        <section className="table-wrapper">
          <table className="duty-table">
            <thead>
              <tr>
                <th className="sticky-col">Day</th>
                {tasks.map((task, idx) => (
                  <th key={idx}>
                    {isEditing ? (
                      <select 
                        value={task} 
                        onChange={(e) => handleTaskChange(idx, e.target.value)}
                        style={{ padding: '2px', fontSize: 'inherit', width: '100%' }}
                      >
                        {[...new Set([...ALL_TASK_OPTIONS, task])].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      task
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, dayIdx) => (
                <tr key={DAYS[dayIdx]}>
                  <td className="day-cell sticky-col">
                    <div className="day-name">{DAYS[dayIdx]}</div>
                  </td>
                  {row.map((name, colIdx) => (
                    <td key={colIdx} className="duty-cell" style={{ padding: isEditing ? '2px' : undefined }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={name || ''}
                          onChange={(e) => handleSlotChange(dayIdx, colIdx, e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '4px',
                            textAlign: 'center',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        name || <span className="empty-slot">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="week-navigation" style={{ justifyContent: 'center' }}>
          {isEditing ? (
            <button onClick={() => setIsEditing(false)} className="nav-button today-button" style={{ margin: '0 10px' }}>
              Save
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="nav-button" style={{ margin: '0 10px' }}>
              Edit
            </button>
          )}
        </section>

        {/* UI Toggle Button */}
        {backgroundImage && (
          <button className="ui-toggle" onClick={(e) => { e.stopPropagation(); setShowUI(!showUI); }}>
            {showUI ? '👁️' : '👁️‍🗨️'}
          </button>
        )}

        {/* Password prompt */}
        {showPasswordPrompt && (
          <div className="admin-overlay" onClick={handlePasswordCancel}>
            <div className="admin-panel password-panel" onClick={(e) => e.stopPropagation()}>
              <h2>Enter Password</h2>
              <div className="admin-input-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  autoFocus
                />
              </div>
              <button className="admin-button" onClick={handlePasswordSubmit}>
                Submit
              </button>
              <button className="admin-button close-btn" onClick={handlePasswordCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Admin panel for background image */}
        {showAdmin && (
           <div className="admin-overlay" onClick={handleCloseAdmin}>
           <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
             <h2>Set Background Image</h2>
             
             <div className="admin-input-group">
               <label>Image URL:</label>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <input
                   type="text"
                   placeholder="Paste image URL here"
                   value={imageUrl}
                   onChange={(e) => setImageUrl(e.target.value)}
                   style={{ flex: 1 }}
                 />
                 <button className="preview-btn" onClick={handlePreviewUrl}>
                   Preview
                 </button>
               </div>
             </div>

             <div className="admin-input-group">
               <label>Or upload an image:</label>
               <input
                 type="file"
                 accept="image/*"
                 onChange={handleImageUpload}
               />
             </div>

             {previewImage && (
               <>
                 <div className="admin-input-group">
                   <label>Preview (drag to adjust position):</label>
                   <div 
                     className="image-preview" 
                     style={previewStyle}
                     onMouseDown={handleMouseDown}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onMouseLeave={handleMouseUp}
                   ></div>
                 </div>

                 <button className="admin-button" onClick={handleSetBackground}>
                   Set Image
                 </button>
               </>
             )}

             {backgroundImage && (
               <button className="admin-button reset-btn" onClick={handleResetBackground}>
                 Reset Background
               </button>
             )}

             <button className="admin-button close-btn" onClick={handleCloseAdmin}>
               Close
             </button>
           </div>
         </div>
        )}
      </div>
    </div>
  );
}