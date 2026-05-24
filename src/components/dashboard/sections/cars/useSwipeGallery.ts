import { useCallback, useMemo, useRef, type Dispatch, type SetStateAction, type TouchEvent } from 'react'

const SWIPE_THRESHOLD_PX = 40

export function useSwipeGallery(
  length: number,
  setIndex: Dispatch<SetStateAction<number>>,
) {
  const touchStartX = useRef<number | null>(null)

  const goNext = useCallback(() => {
    if (length <= 1) return
    setIndex((prev) => (prev + 1) % length)
  }, [length, setIndex])

  const goPrev = useCallback(() => {
    if (length <= 1) return
    setIndex((prev) => (prev - 1 + length) % length)
  }, [length, setIndex])

  const swipeHandlers = useMemo(
    () => ({
      onTouchStart: (e: TouchEvent) => {
        touchStartX.current = e.touches[0]?.clientX ?? null
      },
      onTouchEnd: (e: TouchEvent) => {
        if (touchStartX.current === null || length <= 1) return
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
        const diff = touchStartX.current - endX
        touchStartX.current = null
        if (Math.abs(diff) < SWIPE_THRESHOLD_PX) return
        if (diff > 0) goNext()
        else goPrev()
      },
    }),
    [length, goNext, goPrev],
  )

  return { swipeHandlers, goNext, goPrev }
}
