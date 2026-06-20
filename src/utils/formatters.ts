/**
 * Formats a PFA registration type for display.
 * e.g., "NuAmPfa" -> "Nu am PFA", "AmPfa" -> "Am PFA"
 */
export function formatRegistrationType(type: string | null | undefined): string {
  if (!type) return '—';
  switch (type) {
    case 'NuAmPfa':
      return 'Nu am PFA';
    case 'AmPfa':
      return 'Am PFA';
    default:
      return type;
  }
}

/**
 * Formats a document category for display.
 * e.g., "CertificatInregistrare" -> "Certificat de Înregistrare"
 */
export function formatDocumentCategory(category: string | null | undefined): string {
  if (!category) return '—';
  switch (category) {
    case 'CertificatInregistrare':
      return 'Certificat de Înregistrare';
    case 'CertificatConstatator':
      return 'Certificat constatator';
    case 'DovadaPlataArr':
      return 'Dovada plății tarif ARR';
    case 'AutorizatieTransportAlternativ':
      return 'Autorizație transport alternativ';
    case 'Talon':
      return 'Talon / Certificat de înmatriculare';
    case 'CarteIdentitateAuto':
      return 'Cartea de identitate a autoturismului';
    case 'ContractVehicul':
      return 'Contract închiriere / comodat / leasing';
    case 'AcordLeasing':
      return 'Acord de leasing';
    case 'DovadaPlataCopieConformaEcusoane':
      return 'Dovada plății copie conformă și ecusoane';
    case 'CopieConforma':
      return 'Copie conformă';
    case 'Buletin':
      return 'Buletin / CI';
    case 'AtestatSofer':
      return 'Atestat Șofer';
    case 'AtestatTransport':
      return 'Atestat Transport';
    case 'CazierJudiciar':
      return 'Cazier Judiciar';
    case 'AdeverintaMedicala':
      return 'Adeverință Medicală';
    case 'ITP':
      return 'ITP Valid';
    case 'RCA':
      return 'Poliță RCA';
    case 'PermisConducere':
      return 'Permis de Conducere';
    case 'CarteIdentitate':
      return 'Carte de Identitate';
    case 'EcusonUber':
      return 'Ecuson Uber';
    case 'EcusonBolt':
      return 'Ecuson Bolt';
    case 'AsigurareCalatori':
      return 'Asigurare Călători';
    case 'ExtrasBancar':
      return 'Extras Bancar';
    case 'RaportUber':
      return 'Raport venituri Uber';
    case 'RaportBolt':
      return 'Raport venituri Bolt';
    case 'Cheltuiala':
      return 'Cheltuială deductibilă';
    case 'CererePfa':
      return 'Cerere Înregistrare PFA';
    case 'Other':
      return 'Altele';
    default:
      // Try to add spaces to PascalCase as a fallback
      return category.replace(/([A-Z])/g, ' $1').trim();
  }
}
