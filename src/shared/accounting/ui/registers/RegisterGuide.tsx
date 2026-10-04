import { Paper, Stack, Tab, Tabs, Typography } from '@mui/material'

const REGISTER_GUIDE = {
  rjip: { label: 'Încasări și plăți', title: 'Registrul-jurnal de încasări și plăți (RJIP)', description: 'Arată mișcările de bani prin bancă și numerar, pe date și documente. În aplicație se formează din tranzacțiile contabile: importuri bancare, rapoarte Z, documente și operațiuni manuale. Contabilul verifică asocierile și clasificarea; un virament Uber/Bolt nu ține locul tuturor documentelor platformei.' },
  ref: { label: 'Evidență fiscală', title: 'Registrul de evidență fiscală (REF)', description: 'Arată cum sunt agregate veniturile și cheltuielile pentru calculul rezultatului fiscal anual. În aplicație se completează din operațiunile contabile și amortizarea activelor. Nu introduci aceleași sume încă o dată: corecțiile se fac în tranzacții, deductibilitate și active. Deschide un rând pentru a vedea ce operațiuni îl compun.' },
  assets: { label: 'Active și fișe MF', title: 'Active și fișe de mijloc fix', description: 'Aici sunt bunurile urmărite individual, valoarea rămasă și amortizarea. Contabilul înregistrează sau verifică bunul pe baza documentului de achiziție. Fișa MF este documentul individual al unui mijloc fix; obiectele de inventar sunt afișate separat de mijloacele fixe.' },
  inventory: { label: 'Inventar', title: 'Inventarul PFA-ului', description: 'Arată bunurile și valorile constatate la inventariere. Contabilul pornește inventarierea, PFA-ul confirmă ce există și semnalează diferențele, apoi contabilul finalizează. O propunere încă neconfirmată nu este un inventar final.' },
  year: { label: 'Arhivă anuală', title: 'Închiderea anului și arhiva', description: 'Aici urmărești anii contabili și descarci pachetele disponibile după închidere. Registrele curente se consultă în secțiunile de mai sus; arhiva păstrează situațiile anilor închiși.' },
} as const
export type RegisterSection = keyof typeof REGISTER_GUIDE

export function RegisterGuide({ value, onChange }: { value: RegisterSection; onChange: (value: RegisterSection) => void }) {
  const guide = REGISTER_GUIDE[value]
  return <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
    <Tabs value={value} onChange={(_, next: RegisterSection) => onChange(next)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Tip de registru" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      {Object.entries(REGISTER_GUIDE).map(([key, item]) => <Tab key={key} value={key} label={item.label} />)}
    </Tabs>
    <Stack spacing={1} sx={{ p: { xs: 2, md: 2.5 } }}>
      <Typography component="h2" sx={{ fontWeight: 700, fontSize: 16 }}>{guide.title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 960, lineHeight: 1.7 }}>{guide.description}</Typography>
    </Stack>
  </Paper>
}
