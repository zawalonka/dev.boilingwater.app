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

import { useState, useRef, useEffect } from 'react'
import '../styles/Header.css'

/**
 * Header Function Component
 * 
 * Props:
 * - onMenuClick: Optional callback function to notify parent when menu is toggled
 *   (Currently unused but available for future features like analytics or state changes)
 * - onRestart: Optional callback function to restart the game
 */
function Header({ onMenuClick, onRestart }) {
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

  /**
   * handleRestart - Restart the game
   * Reloads the page to reset everything to initial state
   */
  const handleRestart = () => {
    if (onRestart) {
      onRestart()  // Call parent's restart function if provided
    } else {
      window.location.reload()  // Default: reload the page
    }
    setMenuOpen(false)  // Close menu after restarting
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

        {/* 
          ===== BETA BADGE =====
          Shows "Beta" label in header
        */}
        <span className="beta-badge">Beta</span>
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
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#docs">Documentation</a></li>
            <li><a href="#settings">Settings</a></li>
            <li><button onClick={handleRestart} className="menu-restart-btn">🔄 Restart Game</button></li>
          </ul>
        </nav>
      )}
    </header>
  )
}

export default Header
