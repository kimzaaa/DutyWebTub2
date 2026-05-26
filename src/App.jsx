import React from "react";
import config from "./data/config.json";
import { useSchedule, DAYS, TASKS, MS_PER_DAY } from "./hooks/useSchedule";
import { useBackground } from "./hooks/useBackground";
import "./styles/App.css";

export default function App({ className, dataset }) {
  const displayClass = className.replace('-', '/');

  const {
    selectedDate,
    currentMonday,
    grid,
    formatShortDate,
    formatDateInput,
    handleDateChange,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
  } = useSchedule(dataset);

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
    imageOffset,
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

  return (
    <div className="app-root" style={backgroundStyle} onClick={handleGlobalClick}>
      <div 
        className={`app-card${backgroundImage && fadeIn ? ' fade-in' : ''}${!showUI ? ' hidden' : ''}`} 
        style={{ background: backgroundImage ? 'rgba(255, 255, 255, 0)' : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="app-header">
          <h1>ตารางเวร {displayClass}</h1>
          <p className="subtitle">
            By Kimza :DDD
          </p>
        </header>

        <section className="controls">
          <div className="date-picker centered">
            <label>
              Select date:
              <input
                type="date"
                value={formatDateInput(selectedDate)}
                onChange={handleDateChange}
              />
            </label>
            <div className="current-week-dates">
              Week of{" "}
              {currentMonday.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </section>

        <section className="table-wrapper">
          <table className="duty-table">
            <thead>
              <tr>
                <th className="sticky-col">Day</th>
                {TASKS.map((task, idx) => (
                  <th key={idx}>{task}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, dayIdx) => {
                const rowDate = new Date(currentMonday.getTime() + dayIdx * MS_PER_DAY);
                const isToday = formatDateInput(rowDate) === formatDateInput(new Date());
                const rowClasses = isToday ? "today-highlight" : "";
                const dayCellClasses = "day-cell sticky-col";

                return (
                  <tr key={DAYS[dayIdx]} className={rowClasses}>
                    <td className={dayCellClasses}>
                      <div className="day-name">{DAYS[dayIdx]}</div>
                      <div className="day-date">{formatShortDate(rowDate)}</div>
                    </td>
                    {row.map((name, colIdx) => (
                      <td key={colIdx} className="duty-cell">
                        {name || <span className="empty-slot">–</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="week-navigation">
          <button onClick={goToPrevWeek} className="nav-button">
            ← Previous week
          </button>
          <button onClick={goToToday} className="nav-button today-button">
            Today
          </button>
          <button onClick={goToNextWeek} className="nav-button">
            Next week →
          </button>
        </section>

        {/* Click counter indicator */}
        {clickCount === 9 && !showAdmin && !showPasswordPrompt && (
          <div className="click-counter">
            9/10
          </div>
        )}

        {/* UI Toggle Button - Always visible when background exists */}
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