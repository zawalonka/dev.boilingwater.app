/**
 * Header Component
 * 
 * This is the top navigation bar of the application.
 * It displays:
 * - App title ("Boiling Water")
 * - Level and Experiment dropdowns (when in game view)
 * - Hamburger menu button (on the right side)
 * - Dropdown menu with navigation links (appears when hamburger is clicked)
 * 
 * The header is fixed at the top of the viewport and doesn't scroll with the page.
 * It's positioned above the main game scene.
 */

import { useState } from 'react'
import '../styles/Header.css'
import { EXPERIMENTS } from '../constants/workshops'

/**
 * Header Function Component
 * 
 * Props:
 * - onMenuClick: Optional callback function to notify parent when menu is toggled
 * - onNavigate: Navigate to a given view (game, about, docs, issue, workshop)
 * - onReload: Reload the current level/game view
 * - onWorkshopChange: Change the active workshop id
 * - onLevelChange: Change the active level id
 * - onExperimentChange: Change the active experiment id
 * - onSkipTutorial: Skip the tutorial and reveal level selectors
 * - activeWorkshopId: Currently selected workshop id
 * - activeLevel: Currently selected level (numeric: 0, 1, 2...)
 * - activeExperiment: Currently selected experiment id
 * - availableWorkshops: Array of workshop ids to choose from (filtered by level)
 * - availableLevels: Array of level objects with id, name, order
 * - availableExperiments: Array of experiment objects for current level
 * - activeView: Current active view (game, about, docs, submit-issue, submit-workshop)
 * - showSelectors: Whether to show level/workshop selector dropdowns
 */
function Header({ 
  onMenuClick, 
  onNavigate, 
  onReload,
  onWorkshopChange,
  onLevelChange,
  onExperimentChange,
  onSkipTutorial,
  activeWorkshopId,
  activeLevel,
  activeExperiment,
  availableWorkshops = [],
  availableLevels = [],
  availableExperiments = [],
  activeView,
  showSelectors = false
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

  // Workshop selector
  const handleWorkshopChange = (e) => {
    const next = e.target.value
    onWorkshopChange?.(next)
  }

  // Level selector
  const handleLevelChange = (e) => {
    const next = e.target.value
    onLevelChange?.(next)
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

        {/* App title (keep clean; experiment name lives in dropdown) */}
        <h1 className="app-title">Boiling Water</h1>

        {/* Skip Tutorial button (Boiling Water experiment only) */}
        {activeExperiment === 'boiling-water' && !showSelectors && (
          <button 
            className="skip-tutorial-banner-button"
            onClick={onSkipTutorial}
            title="Skip the tutorial and unlock level and experiment selectors"
          >
            ⏭️ Skip Tutorial
            <span className="skip-tutorial-note">⚠️ Resets level</span>
          </button>
        )}

        {/* Level and Experiment selectors (hidden until tutorial passed or skipped) */}
        {showSelectors && activeView === 'game' && (
          <>
            {/* Level selector - Numeric levels */}
            <div className="level-selector">
              <label htmlFor="level-select" className="level-label">Level:</label>
              <select 
                id="level-select" 
                value={activeLevel} 
                onChange={(e) => onLevelChange?.(parseInt(e.target.value))}
              >
                {availableLevels.map((level) => (
                  <option key={level.id} value={level.id}>{`Level ${level.id}`}</option>
                ))}
              </select>
              <span className="level-note">⚠️ Resets game</span>
            </div>

            {/* Experiment selector - Changes within current level */}
            {availableExperiments.length > 0 && (
              <div className="experiment-selector">
                <label htmlFor="experiment-select" className="experiment-label">Experiment:</label>
                <select 
                  id="experiment-select" 
                  value={activeExperiment} 
                  onChange={(e) => onExperimentChange?.(e.target.value)}
                >
                  {availableExperiments.map((exp, idx) => (
                    <option key={exp.id} value={exp.id}>{`${idx + 1}. ${exp.name}`}</option>
                  ))}
                </select>
                <span className="level-note">⚠️ Resets game</span>
              </div>
            )}

            {/* Workshop selector - Visual variant within current level */}
            <div className="workshop-selector">
              <label htmlFor="workshop-select" className="workshop-label">Workshop:</label>
              <select id="workshop-select" value={activeWorkshopId} onChange={handleWorkshopChange}>
                {availableWorkshops.map((workshop) => (
                  <option key={workshop.id} value={workshop.id}>{workshop.name}</option>
                ))}
              </select>
              <span className="level-note">⚠️ Resets game</span>
            </div>

            {/* Reset level button */}
            <button 
              className="reset-level-button"
              onClick={handleReload}
              title="Reset current level to starting state"
            >
              🔄 Reset
            </button>
          </>
        )}
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
            <li>
              <a
                href="/wiki/index.html"
                className="menu-link"
                target="_blank"
                rel="noreferrer"
              >
                Wiki
              </a>
            </li>
            <li><button onClick={() => handleNavigate('submit-issue')} className="menu-link">Submit Issue</button></li>
            <li><button onClick={() => handleNavigate('submit-workshop')} className="menu-link">Submit Workshop</button></li>
          </ul>
        </nav>
      )}
    </header>
  )
}

export default Header
