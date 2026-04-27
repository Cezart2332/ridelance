export interface DeductibleItem {
  name: string;
  deductible: string;
}

export interface DeductibleCategory {
  name: string;
  items: DeductibleItem[];
}

export const deductibleExpensesData: DeductibleCategory[] = [
  {
    "name": "Asigurari",
    "items": [
      {
        "name": "Asigurări / abonamente medicale",
        "deductible": "400 €/an"
      },
      {
        "name": "Pensii private",
        "deductible": "400 €/an"
      },
      {
        "name": "Asigurări călătorie (în legătură cu activitatea PFA / PFI)",
        "deductible": "100%"
      },
      {
        "name": "Asigurări malpraxis",
        "deductible": "100%"
      }
    ]
  },
  {
    "name": "Auto/Moto",
    "items": [
      {
        "name": "Combustibil auto / moto (benzină / motorină / GPL)",
        "deductible": "50%"
      },
      {
        "name": "Taxa ITP",
        "deductible": "50%"
      },
      {
        "name": "Chirie auto / moto",
        "deductible": "100%"
      },
      {
        "name": "Motocicletă",
        "deductible": "100%"
      },
      {
        "name": "Scuter",
        "deductible": "100%"
      },
      {
        "name": "Trotinetă",
        "deductible": "100%"
      },
      {
        "name": "Autoturism",
        "deductible": "100%"
      },
      {
        "name": "Leasing financiar (plată avans)",
        "deductible": "100%"
      },
      {
        "name": "Leasing financiar (plată dobandă)",
        "deductible": "100%"
      },
      {
        "name": "Leasing financiar (plată comisioane)",
        "deductible": "100%"
      },
      {
        "name": "Leasing financiar asigurări (CASCO & RCA)",
        "deductible": "50%"
      },
      {
        "name": "Leasing operațional (plată avans)",
        "deductible": "100%"
      },
      {
        "name": "Leasing operațional (plată dobandă)",
        "deductible": "100%"
      },
      {
        "name": "Leasing operațional (plată comisioane)",
        "deductible": "100%"
      },
      {
        "name": "Leasing operațional asigurări (CASCO & RCA)",
        "deductible": "50%"
      },
      {
        "name": "Anvelope (cauciucuri) auto / moto / biciclete",
        "deductible": "50%"
      },
      {
        "name": "Lanțuri auto",
        "deductible": "50%"
      },
      {
        "name": "Piese auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Revizie auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Trecere pod",
        "deductible": "50%"
      },
      {
        "name": "Manoperă reparații auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Accesorii pentru interior auto",
        "deductible": "50%"
      },
      {
        "name": "Accesorii pentru exterior auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Colantare auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Aspirator auto",
        "deductible": "50%"
      },
      {
        "name": "Produse de curățare auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Portbagaj exterior auto",
        "deductible": "50%"
      },
      {
        "name": "Vopsea auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Kit de siguranță auto (trusa medicală, triunghiuri, stingător, vestă etc.)",
        "deductible": "50%"
      },
      {
        "name": "Oglinzi auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Sisteme pentru testări și diagnoze auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Truse pentru reparații auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Cască de protecție",
        "deductible": "50%"
      },
      {
        "name": "Cameră video auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Navigator GPS",
        "deductible": "50%"
      },
      {
        "name": "Baterie auto / moto",
        "deductible": "50%"
      },
      {
        "name": "Consumabile auto / moto (ulei, lichid de parbriz etc.)",
        "deductible": "50%"
      },
      {
        "name": "Suport telefon",
        "deductible": "50%"
      },
      {
        "name": "Curățare auto / moto",
        "deductible": "50%"
      }
    ]
  },
  {
    "name": "Biciclete",
    "items": [
      {
        "name": "Bicicletă",
        "deductible": "100%"
      },
      {
        "name": "Chirie bicicletă",
        "deductible": "100%"
      },
      {
        "name": "Revizie bicicletă",
        "deductible": "100%"
      },
      {
        "name": "Alte accesorii bicicletă",
        "deductible": "100%"
      },
      {
        "name": "Oglinzi bicicletă",
        "deductible": "100%"
      },
      {
        "name": "Truse pentru reparații bicicletă",
        "deductible": "100%"
      },
      {
        "name": "Baterie bicicletă electrică",
        "deductible": "100%"
      },
      {
        "name": "Consumabile bicicletă (ulei, becuri etc)",
        "deductible": "100%"
      },
      {
        "name": "Suport bicicletă pentru depozitare în casă",
        "deductible": "100%"
      },
      {
        "name": "Cutii depozitare accesorii pentru biciclete",
        "deductible": "100%"
      },
      {
        "name": "Calculatoare pentru biciclete",
        "deductible": "100%"
      },
      {
        "name": "Iluminat pentru biciclete",
        "deductible": "100%"
      },
      {
        "name": "Încuietori cablu pentru biciclete",
        "deductible": "100%"
      },
      {
        "name": "Anvelope și camere de biciclete",
        "deductible": "100%"
      },
      {
        "name": "Huse pentru șa de bicicletă",
        "deductible": "100%"
      },
      {
        "name": "Coșuri și remorci pentru biciclete",
        "deductible": "100%"
      },
      {
        "name": "Truse de vulcanizare pentru biciclete",
        "deductible": "100%"
      },
      {
        "name": "Manoperă reparații bicicletă",
        "deductible": "100%"
      },
      {
        "name": "Curățare biciclete",
        "deductible": "100%"
      }
    ]
  },
  {
    "name": "Carti, papetarie si jucarii",
    "items": [
      {
        "name": "Cărți dezvoltare profesională (inclusiv audio)",
        "deductible": "100%"
      },
      {
        "name": "Dosar de plastic",
        "deductible": "100%"
      },
      {
        "name": "Portofolii, serviete și clipboard-uri",
        "deductible": "100%"
      },
      {
        "name": "Plută și panouri textile",
        "deductible": "100%"
      },
      {
        "name": "Sisteme de afișare, prezentare și planificatoare",
        "deductible": "100%"
      },
      {
        "name": "Flipcharts",
        "deductible": "100%"
      },
      {
        "name": "Accesorii de prezentare",
        "deductible": "100%"
      },
      {
        "name": "Pixuri",
        "deductible": "100%"
      },
      {
        "name": "Corector și radieră",
        "deductible": "100%"
      },
      {
        "name": "Seturi de birou",
        "deductible": "100%"
      },
      {
        "name": "Pixuri",
        "deductible": "100%"
      },
      {
        "name": "Căptușeli",
        "deductible": "100%"
      },
      {
        "name": "Markere",
        "deductible": "100%"
      },
      {
        "name": "Creioane și ascuțitori",
        "deductible": "100%"
      },
      {
        "name": "Instrumente de scriere premium",
        "deductible": "100%"
      },
      {
        "name": "Rezerve și cerneală",
        "deductible": "100%"
      },
      {
        "name": "Role hârtie",
        "deductible": "100%"
      },
      {
        "name": "Benzi adezive",
        "deductible": "100%"
      },
      {
        "name": "Hârtie pentru copiator",
        "deductible": "100%"
      },
      {
        "name": "Hârtie de lucru",
        "deductible": "100%"
      },
      {
        "name": "Plicuri",
        "deductible": "100%"
      },
      {
        "name": "Blocuri de hârtie și note post-it",
        "deductible": "100%"
      },
      {
        "name": "Hârtie fotografică",
        "deductible": "100%"
      },
      {
        "name": "Etichete autoadezive",
        "deductible": "100%"
      },
      {
        "name": "Calculatoare de birou",
        "deductible": "100%"
      },
      {
        "name": "Articole de birou",
        "deductible": "100%"
      },
      {
        "name": "Perforatoare",
        "deductible": "100%"
      },
      {
        "name": "Foarfece și tăietori",
        "deductible": "100%"
      },
      {
        "name": "Ștampile",
        "deductible": "100%"
      },
      {
        "name": "Ghilotine și trimmere",
        "deductible": "100%"
      },
      {
        "name": "Filme de laminare",
        "deductible": "100%"
      },
      {
        "name": "Laminatoare",
        "deductible": "100%"
      },
      {
        "name": "Tocătoare",
        "deductible": "100%"
      },
      {
        "name": "Caiete",
        "deductible": "100%"
      },
      {
        "name": "Seturi de papetărie",
        "deductible": "100%"
      },
      {
        "name": "Alte accesorii școlare",
        "deductible": "100%"
      },
      {
        "name": "Penare",
        "deductible": "100%"
      }
    ]
  },
  {
    "name": "Contributii catre stat/alte institutii",
    "items": [
      {
        "name": "Contribuții CAS (pensie)",
        "deductible": "100%"
      },
      {
        "name": "Contribuții CASS (sănătate)",
        "deductible": "100%"
      },
      {
        "name": "TVA intracomunitar",
        "deductible": "100%"
      },
      {
        "name": "Impozit reținut la sursă (comision, drepturi de autor etc.)",
        "deductible": "100%"
      },
      {
        "name": "Contribuții reținute la sursă",
        "deductible": "100%"
      },
      {
        "name": "Impozit auto / moto",
        "deductible": "100%"
      },
      {
        "name": "Contribuții asociații profesionale",
        "deductible": "100%"
      },
      {
        "name": "Contribuții organizații profesionale",
        "deductible": "100%"
      }
    ]
  },
  {
    "name": "Electronice",
    "items": [
      {
        "name": "Căști",
        "deductible": "100%"
      },
      {
        "name": "Tablete",
        "deductible": "100%"
      },
      {
        "name": "eBook Reader și accesorii",
        "deductible": "100%"
      }
    ]
  },
  {
    "name": "IT",
    "items": [
      {
        "name": "Laptop / PC",
        "deductible": "100%"
      },
      {
        "name": "Telefoane mobile",
        "deductible": "100%"
      },
      {
        "name": "Monitoare LCD și LED și accesorii",
        "deductible": "100%"
      },
      {
        "name": "Tastaturi",
        "deductible": "100%"
      },
      {
        "name": "Mouse",
        "deductible": "100%"
      },
      {
        "name": "Mouse pad",
        "deductible": "100%"
      },
      {
        "name": "Accesorii IT",
        "deductible": "100%"
      },
      {
        "name": "Huse pentru telefoane mobile",
        "deductible": "100%"
      },
      {
        "name": "Cabluri de date pentru telefonul mobil / tabletă",
        "deductible": "100%"
      },
      {
        "name": "Încărcătoare pentru telefoane mobile / tablete",
        "deductible": "100%"
      },
      {
        "name": "Stick-uri USB",
        "deductible": "100%"
      },
      {
        "name": "Diverse periferice",
        "deductible": "100%"
      },
      {
        "name": "Cameră web",
        "deductible": "100%"
      },
      {
        "name": "DVD Writer",
        "deductible": "100%"
      },
      {
        "name": "Hard disk-uri și accesorii",
        "deductible": "100%"
      },
      {
        "name": "Memorie RAM",
        "deductible": "100%"
      },
      {
        "name": "Plăci de bază",
        "deductible": "100%"
      },
      {
        "name": "Surse de alimentare și baterii externe",
        "deductible": "100%"
      },
      {
        "name": "Procesoare",
        "deductible": "100%"
      },
      {
        "name": "Unitate cu stare solidă (SSD)",
        "deductible": "100%"
      },
      {
        "name": "Plăci de sunet",
        "deductible": "100%"
      },
      {
        "name": "Plăci video",
        "deductible": "100%"
      },
      {
        "name": "Controlere ventilatoare",
        "deductible": "100%"
      },
      {
        "name": "Ventilatoare PC",
        "deductible": "100%"
      },
      {
        "name": "Genți pentru laptop",
        "deductible": "100%"
      },
      {
        "name": "Stații de andocare",
        "deductible": "100%"
      },
      {
        "name": "Baterii de laptop",
        "deductible": "100%"
      },
      {
        "name": "Încărcătoare pentru laptop",
        "deductible": "100%"
      },
      {
        "name": "Sisteme de securitate pentru laptop",
        "deductible": "100%"
      },
      {
        "name": "Suporturi / Coolere pentru notebook",
        "deductible": "100%"
      },
      {
        "name": "Alte accesorii pentru laptop",
        "deductible": "100%"
      },
      {
        "name": "Cartușe de imprimare cu jet de cerneală",
        "deductible": "100%"
      },
      {
        "name": "Tonere pentru imprimante laser",
        "deductible": "100%"
      },
      {
        "name": "Accesorii pentru imprimantă",
        "deductible": "100%"
      },
      {
        "name": "Benzi de etichete pentru imprimantă",
        "deductible": "100%"
      },
      {
        "name": "Cabluri și accesorii",
        "deductible": "100%"
      },
      {
        "name": "Convertoare media",
        "deductible": "100%"
      },
      {
        "name": "Scanere",
        "deductible": "100%"
      },
      {
        "name": "Imprimante și multifuncționale inclusiv 3D și accesorii",
        "deductible": "100%"
      },
      {
        "name": "Adaptoare pentru telefoane mobile",
        "deductible": "100%"
      },
      {
        "name": "Alte accesorii pentru telefoane mobile / tablete",
        "deductible": "100%"
      },
      {
        "name": "Suport auto pentru telefon / tabletă",
        "deductible": "100%"
      },
      {
        "name": "Smartwatch și accesorii",
        "deductible": "100%"
      }
    ]
  },
  {
    "name": "Moda",
    "items": [
      {
        "name": "Ochelari de vedere",
        "deductible": "100%"
      },
      {
        "name": "Lentile de contact",
        "deductible": "100%"
      },
      {
        "name": "Accesorii pentru ochelari și lentile de contact",
        "deductible": "100%"
      },
      {
        "name": "Uniforme",
        "deductible": "100%"
      }
    ]
  },
  {
    "name": "Servicii/alte cheltuieli",
    "items": [
      {
        "name": "Cheltuieli de protocol",
        "deductible": "Limitat"
      },
      {
        "name": "Cheltuieli pregătire profesională",
        "deductible": "100%"
      },
      {
        "name": "Servicii contabilitate",
        "deductible": "100%"
      },
      {
        "name": "Servicii juridice",
        "deductible": "100%"
      },
      {
        "name": "Abonamente fitness",
        "deductible": "100 €/an"
      },
      {
        "name": "Abonamente telefonie mobilă",
        "deductible": "100%"
      },
      {
        "name": "Abonamente platforme IT",
        "deductible": "100%"
      },
      {
        "name": "Comisioane bancare",
        "deductible": "100%"
      },
      {
        "name": "Dobânda și comision credit",
        "deductible": "100%"
      },
      {
        "name": "Cazare în scopul desfășurării activității PFA",
        "deductible": "100%"
      },
      {
        "name": "Formulare tipizate",
        "deductible": "100%"
      },
      {
        "name": "Registre contabile",
        "deductible": "100%"
      }
    ]
  }
];
