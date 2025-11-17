import { useState, useMemo } from "react";
import dutyBase from "./data/dutyBase.json";
import config from "./data/config.json";
import "./App.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TASKS = [
  "ถูพื้น",
  "กระจก/จัดโต๊ะ",
  "กวาดพื้น",
  "เก็บขยะ/กระดาน",
  "ถูพื้น",
  "กวาดพื้น",
  "กระจก/โต๊ะ"
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

// Get Monday of the week for a given Date
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Rotate array left by n positions
function rotateLeft(arr, n) {
  const len = arr.length;
  if (len === 0) return [];
  const shift = ((n % len) + len) % len;
  return arr.slice(shift).concat(arr.slice(0, shift));
}

function App() {
  // base Monday of week 0
  const baseMonday = useMemo(
    () => getMonday(dutyBase.startMonday || new Date()),
    []
  );

  // selected date (for calendar & week navigation)
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Secret admin panel for background image
  const [clickCount, setClickCount] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [backgroundImage, setBackgroundImage] = useState(() => {
    return localStorage.getItem("dutyBgImage") || config.backgroundImage || "";
  });
  const [bgPosition, setBgPosition] = useState(() => {
    return localStorage.getItem("dutyBgPosition") || "center";
  });
  const [imageUrl, setImageUrl] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [previewPosition, setPreviewPosition] = useState("center");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageOffset, setImageOffset] = useState({ x: 50, y: 50 });
  const [showUI, setShowUI] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const clickTimeoutRef = useMemo(() => ({ current: null }), []);

  // compute current Monday based on selectedDate
  const currentMonday = useMemo(() => getMonday(selectedDate), [selectedDate]);

  // calculate how many weeks between baseMonday and currentMonday
  const weekOffset = useMemo(() => {
    const diffMs = currentMonday - baseMonday;
    // round to nearest week
    return Math.round(diffMs / MS_PER_WEEK);
  }, [currentMonday, baseMonday]);

  // rotate slots based on weekOffset
  const rotatedSlots = useMemo(() => {
    const baseSlots = dutyBase.slots || [];
    // ensure we have exactly 35 slots (5 rows x 7 tasks)
    const needed = DAYS.length * TASKS.length;
    const filled =
      baseSlots.length >= needed
        ? baseSlots.slice(0, needed)
        : [...baseSlots, ...Array(needed - baseSlots.length).fill("")];

    // split into rows and rotate each row individually
    const rows = [];
    for (let r = 0; r < DAYS.length; r++) {
      const start = r * TASKS.length;
      const row = filled.slice(start, start + TASKS.length);
      rows.push(rotateLeft(row, weekOffset));
    }

    // Enforce constraint: the task "เก็บขยะ/กระดาน" must never be "-".
    // If a row has "-" in that column, pick a swap target from the same row
    // using weighted randomness so that the glass/desk tasks are more likely
    // recipients than floor/ sweep tasks.
    const prohibitedTask = "เก็บขยะ/กระดาน";
    const prohibitedIdx = TASKS.indexOf(prohibitedTask);
    if (prohibitedIdx >= 0) {
      const preferredTasks = ["กระจก/โต๊ะ", "กระจก/จัดโต๊ะ"];
      const lessPreferred = ["ถูพื้น", "กวาดพื้น"];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (row[prohibitedIdx] === "-") {
          // gather candidate indices in this row (exclude prohibitedIdx)
          const candidates = [];
          for (let j = 0; j < row.length; j++) {
            if (j === prohibitedIdx) continue;
            if (row[j] !== "-" && row[j] !== "") candidates.push(j);
          }

          if (candidates.length === 0) continue; // nothing to swap with

          // build weights favoring preferredTasks
          const weights = candidates.map((j) => {
            const taskName = TASKS[j] || "";
            if (preferredTasks.includes(taskName)) return 4; // strong preference
            if (lessPreferred.includes(taskName)) return 1; // lower chance
            return 2; // neutral
          });

          // pick one candidate with weighted randomness
          const total = weights.reduce((a, b) => a + b, 0);
          let rnd = Math.random() * total;
          let pickIdx = 0;
          while (rnd > weights[pickIdx]) {
            rnd -= weights[pickIdx];
            pickIdx++;
          }
          const swapIdx = candidates[pickIdx];

          // perform swap
          const tmp = row[prohibitedIdx];
          row[prohibitedIdx] = row[swapIdx];
          row[swapIdx] = tmp;
        }
      }
    }

    return rows; // array of 5 rows, each an array of 7 names
  }, [weekOffset]);

  // rotatedSlots is already an array of rows (5 x 7)
  const grid = rotatedSlots;

  // short date for table rows (e.g. "Nov 17")
  const formatShortDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // (no row highlighting required)

  // format date for <input type="date">
  const formatDateInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    setSelectedDate(new Date(value));
  };

  const goToPrevWeek = () => {
    setSelectedDate((prev) => new Date(prev.getTime() - MS_PER_WEEK));
  };

  const goToNextWeek = () => {
    setSelectedDate((prev) => new Date(prev.getTime() + MS_PER_WEEK));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleGlobalClick = (e) => {
    if (showAdmin || showPasswordPrompt) return; // Don't count clicks when admin is open
    
    // Only count clicks on the background (app-root), not on UI components
    if (e.target.className !== 'app-root') return;
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    // Clear existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    // Reset counter after 1 second of inactivity
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 1000);
    
    if (newCount >= 10) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      setShowPasswordPrompt(true);
      setClickCount(0);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === config.adminPassword) {
      setShowPasswordPrompt(false);
      setShowAdmin(true);
      setPassword("");
    } else {
      alert("Incorrect password!");
      setPassword("");
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    setPassword("");
    setClickCount(0);
  };

  const handlePreviewUrl = () => {
    if (imageUrl.trim()) {
      setPreviewImage(imageUrl.trim());
      setPreviewPosition("center");
      setImageOffset({ x: 50, y: 50 });
    }
  };

  const handleSetBackground = () => {
    if (previewImage) {
      const position = `${imageOffset.x}% ${imageOffset.y}%`;
      setBackgroundImage(previewImage);
      setBgPosition(position);
      localStorage.setItem("dutyBgImage", previewImage);
      localStorage.setItem("dutyBgPosition", position);
      setShowAdmin(false);
      setImageUrl("");
      setPreviewImage("");
      setPreviewPosition("center");
      setImageOffset({ x: 50, y: 50 });
      // Trigger fade-in animation
      setShowUI(false);
      setFadeIn(false);
      setTimeout(() => {
        setFadeIn(true);
        setShowUI(true);
      }, 100);
    }
  };

  const handleResetBackground = () => {
    setBackgroundImage("");
    setBgPosition("center");
    localStorage.removeItem("dutyBgImage");
    localStorage.removeItem("dutyBgPosition");
    setShowAdmin(false);
    setPreviewImage("");
    setImageUrl("");
    setImageOffset({ x: 50, y: 50 });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result || "");
        setPreviewPosition("center");
        setImageOffset({ x: 50, y: 50 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloseAdmin = () => {
    setShowAdmin(false);
    setClickCount(0);
    setPreviewImage("");
    setImageUrl("");
    setImageOffset({ x: 50, y: 50 });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setImageOffset((prev) => ({
      x: Math.max(0, Math.min(100, prev.x + deltaX / 3)),
      y: Math.max(0, Math.min(100, prev.y + deltaY / 3))
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const backgroundStyle = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: bgPosition,
        backgroundAttachment: 'fixed'
      }
    : {};

  const previewStyle = previewImage
    ? {
        backgroundImage: `url(${previewImage})`,
        backgroundSize: 'cover',
        backgroundPosition: `${imageOffset.x}% ${imageOffset.y}%`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }
    : {};

  return (
    <div className="app-root" style={backgroundStyle} onClick={handleGlobalClick}>
      <div 
        className={`app-card${backgroundImage && fadeIn ? ' fade-in' : ''}${!showUI ? ' hidden' : ''}`} 
        style={{ background: backgroundImage ? 'rgba(255, 255, 255, 0)' : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="app-header">
          <h1>ตารางเวร 5/2</h1>
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
                const dayCellClasses = "day-cell sticky-col";

                return (
                  <tr key={DAYS[dayIdx]}>
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

        {/* <section className="help-section">
          <h2>How to edit names</h2>
          <ol>
            <li>
              Open <code>src/data/dutyBase.json</code>.
            </li>
            <li>
              Edit the <code>slots</code> array — it should have up to 35
              names.
            </li>
            <li>
              The app will automatically map names across Monday–Friday and
              rotate them weekly.
            </li>
            <li>
              To change the base week, update <code>startMonday</code> (must be
              a Monday).
            </li>
          </ol>
        </section> */}
      </div>
    </div>
  );
}

export default App;
