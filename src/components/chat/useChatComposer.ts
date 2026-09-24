import { HubConnectionState } from '@microsoft/signalr'
import { useState } from 'react'

import { chatService, type ChatMessageDto } from '../../services/chat.service'
import { getChatConnection } from '../../lib/signalr'
import { getErrorMessage } from '../../utils/errorHandler'

/**
 * Trimiterea dintr-un chat: textul pleacă prin SignalR, un fișier (cu textul ca descriere) prin
 * upload. Cu conexiunea pornită, mesajul revine prin `ReceiveMessage`. Fără ea, textul pleacă pe HTTP
 * și mesajul ajunge în listă prin `onSentOffline`.
 */
export function useChatComposer(
  roomId: string | null,
  /**
   * Mesajul trimis, cât conexiunea în timp real nu e pornită: atunci nu mai vine înapoi prin
   * `ReceiveMessage`, deci lista îl adaugă singură. Cu conexiunea pornită nu se cheamă — ar apărea
   * de două ori.
   */
  onSentOffline?: (message: ChatMessageDto) => void,
) {
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
      const live = getChatConnection().state === HubConnectionState.Connected
      if (pendingFile) {
        setProgress(0)
        const sent = await chatService.sendAttachment(roomId, pendingFile, trimmed, setProgress)
        setPendingFile(null)
        if (!live) onSentOffline?.(sent)
      } else if (live) {
        await getChatConnection().invoke('SendMessage', roomId, trimmed)
      } else {
        // Fără conexiune în timp real (rețea mobilă, aplicația a stat în fundal): pe HTTP.
        onSentOffline?.(await chatService.sendText(roomId, trimmed))
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
