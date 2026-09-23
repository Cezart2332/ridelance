import { useState } from 'react'

import { chatService } from '../../services/chat.service'
import { getChatConnection } from '../../lib/signalr'
import { getErrorMessage } from '../../utils/errorHandler'

/**
 * Trimiterea dintr-un chat: textul pleacă prin SignalR, un fișier (cu textul ca descriere) prin
 * upload. În ambele cazuri mesajul revine prin `ReceiveMessage`, deci lista nu se modifică aici.
 */
export function useChatComposer(roomId: string | null) {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  /** `true` dacă s-a trimis, ca apelantul să golească câmpul de text. */
  const send = async (text: string): Promise<boolean> => {
    const trimmed = text.trim()
    if (!roomId || sending || (!trimmed && !pendingFile)) return false

    setSending(true)
    setError(null)
    try {
      if (pendingFile) {
        setProgress(0)
        await chatService.sendAttachment(roomId, pendingFile, trimmed, setProgress)
        setPendingFile(null)
      } else {
        await getChatConnection().invoke('SendMessage', roomId, trimmed)
      }
      return true
    } catch (err) {
      setError(getErrorMessage(err, pendingFile ? 'Nu am putut trimite fișierul.' : 'Nu am putut trimite mesajul.'))
      return false
    } finally {
      setSending(false)
      setProgress(null)
    }
  }

  const pickFile = (file: File) => {
    setError(null)
    setPendingFile(file)
  }

  return { pendingFile, pickFile, clearFile: () => setPendingFile(null), progress, error, setError, sending, send }
}
