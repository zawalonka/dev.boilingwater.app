// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * STUB: PID Controller
 * 
 * This process uses the PID controller to determine how much power
 * (0-100%) the AC should use to reach the temperature setpoint.
 * 
 * Purpose in this process: Control algorithm that determines AC power level.
 * 
 * @see ../../formulas/pidController.js for the actual implementation
 */
export { 
  calculatePidOutput,
  createPidState,
  applyDeadband 
} from '../../formulas/pidController.js'
