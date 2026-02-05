import { describe, it, expect } from 'vitest'
import { 
  celsiusToFahrenheit, 
  fahrenheitToCelsius,
  formatTemperature 
} from '../unitUtils'

describe('unitUtils', () => {
  describe('celsiusToFahrenheit', () => {
    it('converts 0°C to 32°F', () => {
      expect(celsiusToFahrenheit(0)).toBeCloseTo(32, 1)
    })

    it('converts 100°C to 212°F', () => {
      expect(celsiusToFahrenheit(100)).toBeCloseTo(212, 1)
    })

    it('converts 37°C to 98.6°F (body temperature)', () => {
      expect(celsiusToFahrenheit(37)).toBeCloseTo(98.6, 1)
    })
  })

  describe('fahrenheitToCelsius', () => {
    it('converts 32°F to 0°C', () => {
      expect(fahrenheitToCelsius(32)).toBeCloseTo(0, 1)
    })

    it('converts 212°F to 100°C', () => {
      expect(fahrenheitToCelsius(212)).toBeCloseTo(100, 1)
    })

    it('converts 98.6°F to 37°C', () => {
      expect(fahrenheitToCelsius(98.6)).toBeCloseTo(37, 1)
    })
  })

  describe('formatTemperature', () => {
    it('formats temperature values correctly', () => {
      const result = formatTemperature(25, 'C')
      expect(result).toMatch(/25/)
      expect(result).toMatch(/°C/)
    })
  })
})
