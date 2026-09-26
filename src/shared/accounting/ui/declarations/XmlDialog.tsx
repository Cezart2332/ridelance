import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { ErrorBlock, LoadingBlock } from '../components'
import { useApi } from '../useApi'

/** Indentarea unui XML pe o linie; cel deja formatat rămâne cum e. */
function prettyXml(xml: string): string {
  if (xml.includes('\n')) return xml
  let depth = 0
  return xml
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .map((line) => {
      if (/^<\//.test(line)) depth = Math.max(0, depth - 1)
      const indented = `${'  '.repeat(depth)}${line}`
      if (/^<[^!?/][^>]*[^/]>$/.test(line) && !/<\/.+>$/.test(line)) depth++
      return indented
    })
    .join('\n')
}

/** F4: „Vezi XML” — read-only, formatat. */
export function XmlDialog({ versionId, title, onClose }: { versionId: string; title: string; onClose: () => void }) {
  const xml = useApi(() => accountingApi.declarations.getXml(versionId), [versionId])
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {xml.error && <ErrorBlock message={xml.error} onRetry={xml.reload} />}
        {!xml.data && !xml.error && <LoadingBlock />}
        {xml.data && (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              typography: 'caption',
              whiteSpace: 'pre',
            }}
          >
            {prettyXml(xml.data)}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Închide</Button>
      </DialogActions>
    </Dialog>
  )
}
