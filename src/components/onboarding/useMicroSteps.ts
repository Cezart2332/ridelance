import { useContext } from 'react'

import { MicroStepsContext, type MicroStepsValue } from './microStepsContext'

export function useMicroSteps(): MicroStepsValue {
  const context = useContext(MicroStepsContext)
  if (!context) {
    throw new Error('useMicroSteps trebuie folosit în interiorul <MicroStepProvider>.')
  }
  return context
}
