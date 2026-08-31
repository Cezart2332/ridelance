/**
 * Cutia hărții are forma țării, nu o înălțime fixă.
 *
 * De asta depinde limitarea plimbatului. `maxBounds` din Mapbox nu constrânge o axă pe care cadrul
 * e mai mare decât dreptunghiul permis, iar o cutie înaltă arăta mult mai multă latitudine decât
 * are România — deci pe verticală nu se oprea nimic și se ajungea în Turcia. Cu raportul țării,
 * vederea potrivită pe România e chiar cât cutia, iar constrângerea prinde pe ambele axe.
 *
 * `1.41` e raportul real al României proiectate: 9,43° de longitudine, corectate cu cosinusul
 * latitudinii de mijloc, împărțite la 4,65° de latitudine.
 *
 * Lățimea maximă e legată de înălțimea ferestrei ca raportul să se păstreze și pe ecran lat: cu
 * un `maxHeight` simplu, cutia s-ar fi turtit și axa orizontală ar fi rămas nelimitată.
 *
 * Stă în fișier propriu, nu lângă componentă, fiindcă o folosesc și harta, și scheletul ei de
 * încărcare — iar un fișier care exportă și componente, și constante, rupe fast refresh.
 */
export const MAP_FRAME_SX = {
  width: '100%',
  maxWidth: 'calc(70vh * 1.41)',
  aspectRatio: '1.41 / 1',
  minHeight: 260,
  mx: 'auto',
} as const
