import { useState, useMemo } from "react";

export function useBackground(config) {
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

  const handleGlobalClick = (e) => {
    if (showAdmin || showPasswordPrompt) return;
    
    if (e.target.className !== 'app-root') return;
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
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

  return {
    clickCount, showAdmin, showPasswordPrompt, password, setPassword,
    backgroundImage, showUI, setShowUI, fadeIn,
    imageUrl, setImageUrl, previewImage, previewPosition,
    imageOffset,
    handleGlobalClick, handlePasswordSubmit, handlePasswordCancel,
    handlePreviewUrl, handleSetBackground, handleResetBackground,
    handleImageUpload, handleCloseAdmin,
    handleMouseDown, handleMouseMove, handleMouseUp,
    backgroundStyle, previewStyle
  };
}