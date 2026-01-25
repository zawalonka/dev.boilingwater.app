/**
 * Header Component
 * 
 * This is the top navigation bar of the application.
 * It displays:
 * - App title ("Boiling Water")
 * - Hamburger menu button (on the left side)
 * - Dropdown menu with navigation links (appears when hamburger is clicked)
 * 
 * The header is fixed at the top of the viewport and doesn't scroll with the page.
 * It's positioned above the main game scene.
 */

import { useState } from 'react'
import '../styles/Header.css'

/**
 * Header Function Component
 * 
 * Props:
 * - onMenuClick: Optional callback function to notify parent when menu is toggled
 * - onNavigate: Navigate to a given view (game, about, docs, issue, theme)
 * - onReload: Reload the current level/game view
 * - onThemeChange: Change the active theme id
 * - activeThemeId: Currently selected theme id
 * - availableThemes: Array of theme ids to choose from
 * - activeView: Current active view (game, about, docs, submit-issue, submit-theme)
 */
function Header({ 
  onMenuClick, 
  onNavigate, 
  onReload,
  onThemeChange,
  activeThemeId,
  availableThemes = [],
  activeView
}) {
  // ============================================================================
  // STATE
  // ============================================================================

  /**
   * Track whether the dropdown menu is currently open
   * - true: menu is visible
   * - false: menu is hidden
   * Starts as false (menu closed)
   */
  const [menuOpen, setMenuOpen] = useState(false)

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * toggleMenu - Toggle the menu open/closed state
   * 
   * Does two things:
   * 1. Flips the menuOpen state (open → closed, closed → open)
   * 2. Calls the onMenuClick callback if provided by parent component
   *    (This lets parent components react to menu changes)
   */
  const toggleMenu = () => {
    setMenuOpen(!menuOpen)        // Flip the menu state
    onMenuClick?.()               // Call parent callback if it exists (using optional chaining)
  }

  // Navigate helper
  const handleNavigate = (view) => {
    onNavigate?.(view)
    setMenuOpen(false)
  }

  // Reload helper (used when already in game view)
  const handleReload = () => {
    onReload?.()
    setMenuOpen(false)
  }

  // Theme selector
  const handleThemeChange = (e) => {
    const next = e.target.value
    onThemeChange?.(next)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <header className="app-header">
      {/* 
        Main header container
        - Positioned at the very top of the page (fixed positioning via CSS)
        - Contains app title and menu button side-by-side
      */}
      <div className="header-content">
        
        {/* 
          ===== HAMBURGER MENU BUTTON =====
          The three-line menu icon on the left
          Clicking this toggles the dropdown menu open/closed
        */}
        <button 
          className="hamburger-menu"
          onClick={toggleMenu}
          aria-label="Menu"  // Accessibility: screen readers will read "Menu" for this button
        >
          {/* Three <span> elements that form the visual hamburger menu icon */}
          {/* (Styled as three horizontal lines via CSS) */}
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* 
          ===== APP TITLE =====
          Displays "Boiling Water" as the main heading
        */}
        <h1 className="app-title">Boiling Water</h1>

        {/* Theme selector replaces the badge so players can switch themes */}
        <div className="theme-selector">
          <label htmlFor="theme-select" className="theme-label">Theme:</label>
          <select id="theme-select" value={activeThemeId} onChange={handleThemeChange}>
            {availableThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>{theme.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 
        ===== DROPDOWN MENU =====
        Navigation menu with links
        Only rendered if menuOpen === true (conditional rendering using &&)
        When menuOpen is false, this entire section doesn't appear in the DOM
      */}
      {menuOpen && (
        <nav className="menu-dropdown">
          <ul>
            {/* 
              Navigation links
              Currently these are placeholder links (href="#home", etc.)
              In a real app, these might navigate to different pages or trigger app functions
            */}
            <li>
              {activeView === 'game' ? (
                <button onClick={handleReload} className="menu-link">Reload Level</button>
              ) : (
                <button onClick={() => handleNavigate('game')} className="menu-link">Back to Game</button>
              )}
            </li>
            <li><button onClick={() => handleNavigate('about')} className="menu-link">About</button></li>
            <li><button onClick={() => handleNavigate('docs')} className="menu-link">Docs</button></li>
            <li><button onClick={() => handleNavigate('submit-issue')} className="menu-link">Submit Issue</button></li>
            <li><button onClick={() => handleNavigate('submit-theme')} className="menu-link">Submit Theme</button></li>
          </ul>
        </nav>
      )}
    </header>
  )
}

export default Header
