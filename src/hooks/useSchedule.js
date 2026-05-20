import { useState, useMemo } from "react";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const TASKS = [
  "กวาดพื้น",
  "กวาดพื้น",
  "เช็ดกระจก",
  "จัดโต๊ะ",
  "ถูพื้น",
  "ถูพื้น",
  "เก็บขยะ"
];

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); 
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function rotateLeft(arr, n) {
  const len = arr.length;
  if (len === 0) return [];
  const shift = ((n % len) + len) % len;
  return arr.slice(shift).concat(arr.slice(0, shift));
}

export function useSchedule(dutyBase) {
  const baseMonday = useMemo(
    () => getMonday(dutyBase.startMonday || new Date()),
    [dutyBase.startMonday]
  );

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const currentMonday = useMemo(() => getMonday(selectedDate), [selectedDate]);

  const weekOffset = useMemo(() => {
    const diffMs = currentMonday - baseMonday;
    return Math.round(diffMs / MS_PER_WEEK);
  }, [currentMonday, baseMonday]);

  const rotatedSlots = useMemo(() => {
    const baseSlots = dutyBase.slots || [];
    const needed = DAYS.length * TASKS.length;
    const filled =
      baseSlots.length >= needed
        ? baseSlots.slice(0, needed)
        : [...baseSlots, ...Array(needed - baseSlots.length).fill("")];

    const rows = [];
    for (let r = 0; r < DAYS.length; r++) {
      const start = r * TASKS.length;
      const row = filled.slice(start, start + TASKS.length);
      rows.push(rotateLeft(row, weekOffset));
    }

    const prohibitedTask = "เก็บขยะ/กระดาน";
    const prohibitedIdx = TASKS.indexOf(prohibitedTask);
    if (prohibitedIdx >= 0) {
      const preferredTasks = ["กระจก/โต๊ะ", "กระจก/จัดโต๊ะ"];
      const lessPreferred = ["ถูพื้น", "กวาดพื้น"];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (row[prohibitedIdx] === "-") {
          const candidates = [];
          for (let j = 0; j < row.length; j++) {
            if (j === prohibitedIdx) continue;
            if (row[j] !== "-" && row[j] !== "") candidates.push(j);
          }

          if (candidates.length === 0) continue;

          const weights = candidates.map((j) => {
            const taskName = TASKS[j] || "";
            if (preferredTasks.includes(taskName)) return 4; 
            if (lessPreferred.includes(taskName)) return 1; 
            return 2; 
          });

          const total = weights.reduce((a, b) => a + b, 0);
          let rnd = Math.random() * total;
          let pickIdx = 0;
          while (rnd > weights[pickIdx]) {
            rnd -= weights[pickIdx];
            pickIdx++;
          }
          const swapIdx = candidates[pickIdx];

          const tmp = row[prohibitedIdx];
          row[prohibitedIdx] = row[swapIdx];
          row[swapIdx] = tmp;
        }
      }
    }

    return rows;
  }, [weekOffset, dutyBase.slots]);

  const grid = rotatedSlots;

  const formatShortDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

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

  return {
    selectedDate,
    currentMonday,
    grid,
    formatShortDate,
    formatDateInput,
    handleDateChange,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
  };
}