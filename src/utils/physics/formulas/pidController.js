// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * PID CONTROLLER
 * ==============
 * 
 * A Proportional-Integral-Derivative controller is a control loop mechanism
 * that continuously calculates an error value and applies a correction.
 * 
 * While not a physics formula per se, it's a fundamental algorithm in
 * engineering control systems and follows mathematical principles.
 * 
 * EQUATION:
 *   u(t) = Kp × e(t) + Ki × ∫e(t)dt + Kd × de(t)/dt
 * 
 * Where:
 *   u(t) = control output (0 to 1, or -1 to +1 for bidirectional)
 *   e(t) = error = setpoint - measured value
 *   Kp   = proportional gain (immediate response)
 *   Ki   = integral gain (accumulated error correction)
 *   Kd   = derivative gain (rate of change damping)
 * 
 * DISCRETE FORM (for simulation):
 *   P = Kp × error
 *   I = Ki × Σ(error × Δt)  [with anti-windup limits]
 *   D = Kd × (error - previousError) / Δt
 *   output = P + I + D
 * 
 * TUNING:
 *   High Kp: Fast response, may overshoot
 *   High Ki: Eliminates steady-state error, may oscillate
 *   High Kd: Reduces overshoot, sensitive to noise
 * 
 * ANTI-WINDUP:
 *   When the system can't respond fast enough (actuator saturated),
 *   the integral term can "wind up" to huge values. We clamp it.
 * 
 * AC/HVAC EXAMPLE:
 *   setpoint = 20°C (desired room temp)
 *   measured = 25°C (current room temp)
 *   error = 20 - 25 = -5°C (room too hot)
 *   PID output = -0.7 (70% cooling power)
 *   AC runs at 70% of max cooling watts
 * 
 * @see https://en.wikipedia.org/wiki/PID_controller
 */

/**
 * Create initial PID state
 * @returns {object} Fresh PID state
 */
export function createPidState() {
  return {
    integral: 0,
    previousError: 0,
    lastUpdate: Date.now()
  }
}

/**
 * Calculate PID output for one timestep
 * 
 * @param {number} setpoint - Target value
 * @param {number} measured - Current measured value
 * @param {object} pidState - Current PID state { integral, previousError }
 * @param {object} gains - PID gains { Kp, Ki, Kd, integralWindupLimit }
 * @param {number} deltaTime - Time step in seconds
 * @returns {object} { output: -1 to +1, updatedState }
 */
export function calculatePidOutput(setpoint, measured, pidState, gains, deltaTime) {
  const { Kp = 50, Ki = 2, Kd = 10, integralWindupLimit = 100 } = gains
  
  // Error: positive = below setpoint, negative = above setpoint
  const error = setpoint - measured
  
  // Proportional term: immediate response to error
  const P = error * Kp
  
  // Integral term: accumulated error (with anti-windup)
  const newIntegral = Math.max(
    -integralWindupLimit,
    Math.min(integralWindupLimit, pidState.integral + error * deltaTime)
  )
  const I = newIntegral * Ki
  
  // Derivative term: rate of change (damping)
  const D = deltaTime > 0 
    ? ((error - pidState.previousError) / deltaTime) * Kd 
    : 0
  
  // Total output, normalized to -1 to +1 range
  // The /100 scaling factor assumes typical temperature errors of ~10°C max
  const rawOutput = (P + I + D) / 100
  const output = Math.max(-1, Math.min(1, rawOutput))
  
  return {
    output,
    error,
    terms: { P, I, D },
    updatedState: {
      integral: newIntegral,
      previousError: error,
      lastUpdate: Date.now()
    }
  }
}

/**
 * Apply deadband (hysteresis) to PID output
 * Prevents hunting when close to setpoint
 * 
 * @param {number} output - PID output (-1 to +1)
 * @param {number} error - Current error value
 * @param {number} deadband - Deadband range (e.g., 0.5°C)
 * @returns {number} Output with deadband applied (0 if within deadband)
 */
export function applyDeadband(output, error, deadband) {
  if (Math.abs(error) < deadband) {
    return 0
  }
  return output
}

/**
 * Typical PID tuning values for reference
 */
export const PID_PRESETS = {
  // Conservative: slow, stable, no overshoot
  conservative: { Kp: 30, Ki: 1, Kd: 15, integralWindupLimit: 50 },
  
  // Balanced: good for HVAC
  balanced: { Kp: 50, Ki: 2, Kd: 10, integralWindupLimit: 100 },
  
  // Aggressive: fast response, may overshoot
  aggressive: { Kp: 80, Ki: 4, Kd: 5, integralWindupLimit: 150 },
  
  // Critical damping: minimal overshoot
  criticallyDamped: { Kp: 40, Ki: 1, Kd: 20, integralWindupLimit: 80 }
}
