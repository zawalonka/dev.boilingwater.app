// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { useCallback, useEffect, useState } from 'react'

export function usePotDragging({
  layout,
  potRef,
  sceneRef,
  sceneDimensions,
  liquidMass,
  onFill
}) {
  const potStartPos = layout.pot.start || layout.pot.empty || { xPercent: 50, yPercent: 50 }
  const [potPosition, setPotPosition] = useState({ x: potStartPos.xPercent, y: potStartPos.yPercent })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const nextStartPos = layout.pot.start || layout.pot.empty || { xPercent: 50, yPercent: 50 }
    setPotPosition({ x: nextStartPos.xPercent, y: nextStartPos.yPercent })
  }, [layout])

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    if (!potRef.current || !sceneRef.current) return

    try {
      potRef.current.setPointerCapture(e.pointerId)
    } catch (_) {
      // Pointer capture is not supported in some environments.
    }

    setIsDragging(true)

    const rect = potRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    setDragOffset({
      x: e.clientX - centerX,
      y: e.clientY - centerY
    })
  }, [potRef, sceneRef])

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !sceneRef.current) return

    const sceneRect = sceneRef.current.getBoundingClientRect()
    const width = sceneDimensions.width || layout.scene.width || 1
    const height = sceneDimensions.height || layout.scene.height || 1

    let newX = e.clientX - sceneRect.left - dragOffset.x
    let newY = e.clientY - sceneRect.top - dragOffset.y

    let newXPercent = (newX / width) * 100
    let newYPercent = (newY / height) * 100

    newXPercent = Math.max(layout.pot.dragBounds.minX, Math.min(newXPercent, layout.pot.dragBounds.maxX))
    newYPercent = Math.max(layout.pot.dragBounds.minY, Math.min(newYPercent, layout.pot.dragBounds.maxY))

    setPotPosition({ x: newXPercent, y: newYPercent })

    const inWaterStream =
      newXPercent >= layout.waterStream.xRange[0] &&
      newXPercent <= layout.waterStream.xRange[1] &&
      newYPercent >= layout.waterStream.yRange[0] &&
      newYPercent <= layout.waterStream.yRange[1]

    if (inWaterStream && liquidMass < 0.1) {
      onFill?.()
    }
  }, [dragOffset.x, dragOffset.y, isDragging, layout, liquidMass, onFill, sceneDimensions.height, sceneDimensions.width, sceneRef])

  const handlePointerUp = useCallback((e) => {
    try {
      if (potRef.current?.hasPointerCapture?.(e.pointerId)) {
        potRef.current.releasePointerCapture(e.pointerId)
      }
    } catch (_) {
      // Ignore release failures.
    }

    setIsDragging(false)
  }, [potRef])

  return {
    potPosition,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  }
}

export default usePotDragging
