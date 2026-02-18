import { Language, getStandardObjectName, translateObjectName, translateFixedAddressName } from './translations';

// Dictionary for translating user input (room names and fixture names)
// Maps common terms in any language to their translation keys
const userInputTranslationMap: Record<string, string> = {
  // Room names - Dutch
  'entree': 'entree',
  'keuken': 'keuken',
  'eetkamer': 'eetkamer',
  'woonkamer': 'woonkamer',
  'slaapkamer': 'slaapkamer',
  'badkamer': 'badkamer',
  'toilet': 'toilet',
  'gang': 'gang',
  'hal': 'hal',
  'berging': 'berging',
  'zolder': 'zolder',
  'kelder': 'kelder',
  'bureau': 'bureau',
  'kantoor': 'kantoor',
  'serre': 'serre',
  'pantry': 'pantry',
  'voorraadkamer': 'pantry',
  'garage': 'garage',
  'terras': 'terras',
  'balkon': 'balkon',
  'loggia': 'loggia',
  'werkkamer': 'werkkamer',
  'hobbykamer': 'hobbykamer',
  'wasruimte': 'wasruimte',
  'wasplaats': 'wasplaats',
  'technische ruimte': 'technische ruimte',
  'meterkast': 'meterkast',
  'cv-ruimte': 'cv-ruimte',
  'wijnkelder': 'wijnkelder',
  'sauna': 'sauna',
  'jacuzzi': 'jacuzzi',
  'zwembad': 'zwembad',
  'fitness': 'fitness',
  'bioscoop': 'bioscoop',
  'bibliotheek': 'bibliotheek',
  'speelkamer': 'speelkamer',
  'kinderkamer': 'kinderkamer',
  'gastenkammer': 'gastenkammer',
  'logeerkamer': 'logeerkamer',
  'dressing': 'dressing',
  'kledingkamer': 'dressing',
  'slaapkamer 1': 'slaapkamer',
  'slaapkamer 2': 'slaapkamer',
  'slaapkamer 3': 'slaapkamer',
  'badkamer 1': 'badkamer',
  'badkamer 2': 'badkamer',
  'badkamer 3': 'badkamer',
  'toilet 1': 'toilet',
  'toilet 2': 'toilet',
  'toilet 3': 'toilet',
  'overloop 1e': 'overloop',
  'overloop 2e': 'overloop',
  'overloop 3e': 'overloop',
  // Room names - English
  'hall': 'entree',
  'kitchen': 'keuken',
  'dining room': 'eetkamer',
  'living room': 'woonkamer',
  'bedroom': 'slaapkamer',
  'bathroom': 'badkamer',
  'corridor': 'gang',
  'hallway': 'hal',
  'storage': 'berging',
  'attic': 'zolder',
  'basement': 'kelder',
  'office': 'kantoor',
  'conservatory': 'serre',
  'greenhouse': 'serre',
  'larder': 'pantry',
  'terrace': 'terras',
  'balcony': 'balkon',
  'workshop': 'werkkamer',
  'hobby room': 'hobbykamer',
  'laundry room': 'wasruimte',
  'laundry': 'wasruimte',
  'utility room': 'wasplaats',
  'utility': 'wasplaats',
  'technical room': 'technische ruimte',
  'meter cupboard': 'meterkast',
  'fuse box': 'meterkast',
  'boiler room': 'cv-ruimte',
  'wine cellar': 'wijnkelder',
  'cellar': 'wijnkelder',
  'swimming pool': 'zwembad',
  'pool': 'zwembad',
  'gym': 'fitness',
  'fitness room': 'fitness',
  'home cinema': 'bioscoop',
  'cinema': 'bioscoop',
  'library': 'bibliotheek',
  'playroom': 'speelkamer',
  'nursery': 'kinderkamer',
  'children room': 'kinderkamer',
  'guest room': 'gastenkammer',
  'guest bedroom': 'gastenkammer',
  'dressing room': 'dressing',
  'wardrobe': 'dressing',
  // Overloop / Landing
  'overloop': 'overloop',
  'landing': 'overloop',
  'bedroom 1': 'slaapkamer',
  'bedroom 2': 'slaapkamer',
  'bedroom 3': 'slaapkamer',
  'bathroom 1': 'badkamer',
  'bathroom 2': 'badkamer',
  'bathroom 3': 'badkamer',
  'landing 1st': 'overloop',
  'landing 2nd': 'overloop',
  'landing 3rd': 'overloop',
  'landing 1': 'overloop',
  'landing 2': 'overloop',
  'landing 3': 'overloop',
  // Room names - Spanish
  'entrada': 'entree',
  'vestíbulo': 'entree',
  'vestibulo': 'entree',
  'cocina': 'keuken',
  'comedor': 'eetkamer',
  'sala': 'woonkamer',
  'dormitorio': 'slaapkamer',
  'baño': 'badkamer',
  'aseo': 'toilet',
  'pasillo': 'gang',
  'despensa': 'berging',
  'ático': 'zolder',
  'sótano': 'kelder',
  'oficina': 'kantoor',
  'invernadero': 'serre',
  'garaje': 'garage',
  'terraza': 'terras',
  'balcón': 'balkon',
  'logia': 'loggia',
  'taller': 'werkkamer',
  'cuarto de hobby': 'hobbykamer',
  'lavadero': 'wasruimte',
  'cuarto técnico': 'technische ruimte',
  'cuadro de contadores': 'meterkast',
  'sala de calderas': 'cv-ruimte',
  'bodega': 'wijnkelder',
  'piscina': 'zwembad',
  'gimnasio': 'fitness',
  'cine en casa': 'bioscoop',
  'biblioteca': 'bibliotheek',
  'cuarto de juegos': 'speelkamer',
  'habitación de niños': 'kinderkamer',
  'habitación de invitados': 'gastenkammer',
  'vestidor': 'dressing',
  'rellano': 'overloop',
  'rellano 1º': 'overloop',
  'rellano 2º': 'overloop',
  'rellano 3º': 'overloop',
  // Room names - French
  'entrée': 'entree',
  'vestibule': 'entree',
  'cuisine': 'keuken',
  'salle à manger': 'eetkamer',
  'salon': 'woonkamer',
  'chambre': 'slaapkamer',
  'salle de bain': 'badkamer',
  'toilettes': 'toilet',
  'couloir': 'gang',
  'débarras': 'berging',
  'grenier': 'zolder',
  'cave': 'kelder',
  'véranda': 'serre',
  'garde-manger': 'pantry',
  'cellier': 'pantry',
  'terrasse': 'terras',
  'balcon': 'balkon',
  'atelier': 'werkkamer',
  'salle de hobby': 'hobbykamer',
  'buanderie': 'wasruimte',
  'local technique': 'technische ruimte',
  'tableau électrique': 'meterkast',
  'chaudière': 'cv-ruimte',
  'cave à vin': 'wijnkelder',
  'piscine': 'zwembad',
  'salle de sport': 'fitness',
  'home cinéma': 'bioscoop',
  'bibliothèque': 'bibliotheek',
  'salle de jeux': 'speelkamer',
  'chambre d\'enfant': 'kinderkamer',
  'chambre d\'amis': 'gastenkammer',
  'palier': 'overloop',
  'palier 1er': 'overloop',
  'palier 2e': 'overloop',
  'palier 3e': 'overloop',
  // Room names - German
  'Halle': 'entree',
  'halle': 'entree',
  'Eingang': 'entree',
  'eingang': 'entree',
  'Diele': 'hal',
  'diele': 'hal',
  'Küche': 'keuken',
  'küche': 'keuken',
  'Esszimmer': 'eetkamer',
  'esszimmer': 'eetkamer',
  'Wohnzimmer': 'woonkamer',
  'wohnzimmer': 'woonkamer',
  'Schlafzimmer': 'slaapkamer',
  'schlafzimmer': 'slaapkamer',
  'Badezimmer': 'badkamer',
  'badezimmer': 'badkamer',
  'Toilette': 'toilet',
  'toilette': 'toilet',
  'Speicher': 'berging',
  'speicher': 'berging',
  'Dachboden': 'zolder',
  'dachboden': 'zolder',
  'Keller': 'kelder',
  'keller': 'kelder',
  'Büro': 'kantoor',
  'büro': 'kantoor',
  'Wintergarten': 'serre',
  'wintergarten': 'serre',
  'Gewächshaus': 'serre',
  'gewächshaus': 'serre',
  'Speisekammer': 'pantry',
  'speisekammer': 'pantry',
  'Vorratskammer': 'pantry',
  'vorratskammer': 'pantry',
  'Garage': 'garage',
  'Terrasse': 'terras',
  'Balkon': 'balkon',
  'Loggia': 'loggia',
  'Werkstatt': 'werkkamer',
  'werkstatt': 'werkkamer',
  'Hobbyraum': 'hobbykamer',
  'hobbyraum': 'hobbykamer',
  'Waschküche': 'wasruimte',
  'waschküche': 'wasruimte',
  'Technikraum': 'technische ruimte',
  'technikraum': 'technische ruimte',
  'Zählerkasten': 'meterkast',
  'zählerkasten': 'meterkast',
  'Heizungsraum': 'cv-ruimte',
  'heizungsraum': 'cv-ruimte',
  'Weinkeller': 'wijnkelder',
  'weinkeller': 'wijnkelder',
  'Sauna': 'sauna',
  'Jacuzzi': 'jacuzzi',
  'Schwimmbad': 'zwembad',
  'schwimmbad': 'zwembad',
  'Fitnessraum': 'fitness',
  'fitnessraum': 'fitness',
  'Heimkino': 'bioscoop',
  'heimkino': 'bioscoop',
  'Bibliothek': 'bibliotheek',
  'bibliothek': 'bibliotheek',
  'Spielzimmer': 'speelkamer',
  'spielzimmer': 'speelkamer',
  'Kinderzimmer': 'kinderkamer',
  'kinderzimmer': 'kinderkamer',
  'Gästezimmer': 'gastenkammer',
  'gästezimmer': 'gastenkammer',
  'Ankleidezimmer': 'dressing',
  'ankleidezimmer': 'dressing',
  'Flur': 'overloop',
  'flur': 'overloop',
  'Flur 1.': 'overloop',
  'Flur 2.': 'overloop',
  'Flur 3.': 'overloop',
  
  // Fixture names - Dutch
  'lamp': 'lamp',
  'Lamp': 'lamp',
  'wandlamp': 'wandlamp',
  'plafondlamp': 'plafondlamp',
  'hanglamp': 'hanglamp',
  'staande lamp': 'staande lamp',
  'bureaulamp': 'bureaulamp',
  'spots': 'spots',
  'led strip': 'led strip',
  'opbouw': 'opbouw',
  'buitenlamp': 'buitenlamp',
  'tuinlamp': 'tuinlamp',
  'wcd': 'wcd',
  'wandcontactdoos': 'wcd',
  'cd': 'cd',
  'centraaldoos': 'cd',
  'reserve': 'reserve',
  // Zonwering (Dutch)
  'jalouzie': 'jalouzie',
  'rolluik': 'rolluik',
  'zonnescherm': 'zonnescherm',
  'screen': 'screen',
  'gordijn': 'gordijn',
  'rolgordijn': 'rolgordijn',
  'markies': 'markies',
  'uitvalscherm': 'uitvalscherm',
  'buitenjaloezie': 'buitenjaloezie',
  'vitrage': 'vitrage',
  'voile': 'vitrage',
  'lamellendak': 'lamellendak',
  'dakraam': 'dakraam',
  'roldek': 'roldek',
  // Extra lampen (Dutch)
  'tafellamp': 'tafellamp',
  'vloerlamp': 'vloerlamp',
  'sierlamp': 'sierlamp',
  'leeslamp': 'leeslamp',
  'inbouwspot': 'inbouwspot',
  'buitenspot': 'buitenspot',
  'schemerlamp': 'schemerlamp',
  'nachtlamp': 'nachtlamp',
  'downlight': 'downlight',
  'inbouwdownlight': 'downlight',
  'uplight': 'uplight',
  'track light': 'track light',
  'railsysteem': 'track light',
  'linear light': 'linear light',
  'lijnverlichting': 'linear light',
  'panel light': 'panel light',
  'paneelverlichting': 'panel light',
  'cove light': 'cove light',
  'koofverlichting': 'cove light',
  'accent light': 'accent light',
  'accentverlichting': 'accent light',
  'task light': 'task light',
  'werkverlichting': 'task light',
  'emergency light': 'emergency light',
  'noodverlichting': 'emergency light',
  'exit light': 'exit light',
  'uitgangsverlichting': 'exit light',
  'step light': 'step light',
  'trapverlichting': 'step light',
  'garden light': 'tuinlamp',
  'path light': 'padverlichting',
  'padverlichting': 'padverlichting',
  'wall washer': 'wall washer',
  'wandwisser': 'wall washer',
  'flood light': 'flood light',
  'floodlight': 'flood light',
  'schijnwerper': 'flood light',
  // Fixture names - English
  'light': 'lamp',
  'Light': 'lamp',
  'wall light': 'wandlamp',
  'ceiling light': 'plafondlamp',
  'pendant light': 'hanglamp',
  'floor lamp': 'staande lamp',
  'desk lamp': 'bureaulamp',
  'spotlights': 'spots',
  'surface mounted': 'opbouw',
  'outdoor light': 'buitenlamp',
  'socket': 'wcd',
  'electrical socket': 'wcd',
  'power outlet': 'wcd',
  'junction box': 'cd',
  'electrical box': 'cd',
  // Zonwering (English)
  'venetian blind': 'jalouzie',
  'roller shutter': 'rolluik',
  'awning': 'zonnescherm',
  'curtain': 'gordijn',
  'roller blind': 'rolgordijn',
  'markise': 'markies',
  'drop-arm awning': 'uitvalscherm',
  'external venetian blind': 'buitenjaloezie',
  'voile curtain': 'vitrage',
  'louvered roof': 'lamellendak',
  'skylight': 'dakraam',
  'rooflight': 'dakraam',
  'rolling cover': 'roldek',
  // Extra lampen (English)
  'table lamp': 'tafellamp',
  'decorative lamp': 'sierlamp',
  'reading lamp': 'leeslamp',
  'recessed spotlight': 'inbouwspot',
  'outdoor spotlight': 'buitenspot',
  'night light': 'nachtlamp',
  // Fixture names - Spanish
  'luz de pared': 'wandlamp',
  'luz de techo': 'plafondlamp',
  'lámpara colgante': 'hanglamp',
  'lámpara de pie': 'staande lamp',
  'lámpara de escritorio': 'bureaulamp',
  'focos': 'spots',
  'tira led': 'led strip',
  'superficie': 'opbouw',
  'luz exterior': 'buitenlamp',
  'luz de jardín': 'tuinlamp',
  'enchufe': 'wcd',
  'toma de corriente': 'wcd',
  'caja de conexiones': 'cd',
  'caja de empalmes': 'cd',
  'reserva': 'reserve',
  // Zonwering (Spanish)
  'persiana veneciana': 'jalouzie',
  'persiana enrollable': 'rolluik',
  'toldo': 'zonnescherm',
  'pantalla': 'screen',
  'cortina': 'gordijn',
  'visillo': 'vitrage',
  'techo de celosía': 'lamellendak',
  'claraboya': 'dakraam',
  'lucernario': 'dakraam',
  'cubierta enrollable': 'roldek',
  // Extra lampen (Spanish)
  'lámpara de mesa': 'tafellamp',
  'lámpara decorativa': 'sierlamp',
  'lámpara de lectura': 'leeslamp',
  'spot empotrado': 'inbouwspot',
  'foco exterior': 'buitenspot',
  'luz nocturna': 'nachtlamp',
  'luz descendente': 'downlight',
  'luz ascendente': 'uplight',
  'rieles': 'track light',
  'luz lineal': 'linear light',
  'luz de panel': 'panel light',
  'luz de cornisa': 'cove light',
  'luz de acento': 'accent light',
  'luz de trabajo': 'task light',
  'luz de emergencia': 'emergency light',
  'luz de salida': 'exit light',
  'luz de escalera': 'step light',
  'luz de sendero': 'padverlichting',
  'lavado de pared': 'wall washer',
  'proyector': 'flood light',
  'luz': 'lamp',
  'Luz': 'lamp',
  // Fixture names - French
  'lumière murale': 'wandlamp',
  'plafonnier': 'plafondlamp',
  'suspension': 'hanglamp',
  'lampe sur pied': 'staande lamp',
  'lampe de bureau': 'bureaulamp',
  'bande led': 'led strip',
  'applique': 'opbouw',
  'éclairage extérieur': 'buitenlamp',
  'éclairage de jardin': 'tuinlamp',
  'prise': 'wcd',
  'prise électrique': 'wcd',
  'boîte de jonction': 'cd',
  'boîtier de connexion': 'cd',
  'réserve': 'reserve',
  'lumière': 'lamp',
  'Lumière': 'lamp',
  // Zonwering (French)
  'store vénitienne': 'jalouzie',
  'volet roulant': 'rolluik',
  'écran': 'screen',
  'rideau': 'gordijn',
  'marquise': 'markies',
  'store à bras': 'uitvalscherm',
  'store extérieure': 'buitenjaloezie',
  'toit à lames': 'lamellendak',
  'velux': 'dakraam',
  'fenêtre de toit': 'dakraam',
  'couverture roulante': 'roldek',
  // Extra lampen (French)
  'lampe de table': 'tafellamp',
  'lampe décorative': 'sierlamp',
  'lampe de lecture': 'leeslamp',
  'spot encastré': 'inbouwspot',
  'spot extérieur': 'buitenspot',
  'veilleuse': 'nachtlamp',
  'éclairage descendant': 'downlight',
  'éclairage montant': 'uplight',
  'rail lumineux': 'track light',
  'éclairage linéaire': 'linear light',
  'panneau lumineux': 'panel light',
  'éclairage de corniche': 'cove light',
  'éclairage d\'accent': 'accent light',
  'éclairage de travail': 'task light',
  'éclairage d\'urgence': 'emergency light',
  'éclairage de sortie': 'exit light',
  'éclairage d\'escalier': 'step light',
  'éclairage de sentier': 'padverlichting',
  'lavage de mur': 'wall washer',
  'projecteur': 'flood light',
  // Fixture names - German
  'Wandlampe': 'wandlamp',
  'wandlampe': 'wandlamp',
  'Deckenleuchte': 'plafondlamp',
  'deckenleuchte': 'plafondlamp',
  'Hängelampe': 'hanglamp',
  'hängelampe': 'hanglamp',
  'Stehlampe': 'staande lamp',
  'stehlampe': 'staande lamp',
  'Schreibtischlampe': 'bureaulamp',
  'schreibtischlampe': 'bureaulamp',
  'Spots': 'spots',
  'LED-Streifen': 'led strip',
  'led-streifen': 'led strip',
  'Außenleuchte': 'buitenlamp',
  'außenleuchte': 'buitenlamp',
  'Gartenleuchte': 'tuinlamp',
  'gartenleuchte': 'tuinlamp',
  'Steckdose': 'wcd',
  'steckdose': 'wcd',
  'Wandsteckdose': 'wcd',
  'wandsteckdose': 'wcd',
  'Anschlussdose': 'cd',
  'anschlussdose': 'cd',
  'Verteilerdose': 'cd',
  'verteilerdose': 'cd',
  'Reserve': 'reserve',
  'Lampe': 'lamp',
  'lampe': 'lamp',
  // Zonwering (German)
  'Jalousie': 'jalouzie',
  'jalousie': 'jalouzie',
  'Rollladen': 'rolluik',
  'rollladen': 'rolluik',
  'Markise': 'zonnescherm',
  'Bildschirm': 'screen',
  'bildschirm': 'screen',
  'Vorhang': 'gordijn',
  'vorhang': 'gordijn',
  'Rollo': 'rolgordijn',
  'rollo': 'rolgordijn',
  'Korbmarkise': 'uitvalscherm',
  'korbmarkise': 'uitvalscherm',
  'Außenjalousie': 'buitenjaloezie',
  'außenjalousie': 'buitenjaloezie',
  'Gardine': 'vitrage',
  'gardine': 'vitrage',
  'Lamellendach': 'lamellendak',
  'lamellendach': 'lamellendak',
  'Dachfenster': 'dakraam',
  'dachfenster': 'dakraam',
  'Rolladen': 'roldek',
  'rolladen': 'roldek',
  // Extra lampen (German)
  'Tischlampe': 'tafellamp',
  'tischlampe': 'tafellamp',
  'Dekoleuchte': 'sierlamp',
  'dekoleuchte': 'sierlamp',
  'Leselampe': 'leeslamp',
  'leselampe': 'leeslamp',
  'Einbaustrahler': 'inbouwspot',
  'einbaustrahler': 'inbouwspot',
  'Außenstrahler': 'buitenspot',
  'außenstrahler': 'buitenspot',
  'Nachtlicht': 'nachtlamp',
  'nachtlicht': 'nachtlamp',
  'Downlight': 'downlight',
  'Einbaudownlight': 'downlight',
  'einbaudownlight': 'downlight',
  'Uplight': 'uplight',
  'Schienenbeleuchtung': 'track light',
  'schienenbeleuchtung': 'track light',
  'Lineare Beleuchtung': 'linear light',
  'lineare beleuchtung': 'linear light',
  'Panelbeleuchtung': 'panel light',
  'panelbeleuchtung': 'panel light',
  'Koffenbeleuchtung': 'cove light',
  'koffenbeleuchtung': 'cove light',
  'Akzentbeleuchtung': 'accent light',
  'akzentbeleuchtung': 'accent light',
  'Arbeitsbeleuchtung': 'task light',
  'arbeitsbeleuchtung': 'task light',
  'Notbeleuchtung': 'emergency light',
  'notbeleuchtung': 'emergency light',
  'Ausgangsbeleuchtung': 'exit light',
  'ausgangsbeleuchtung': 'exit light',
  'Treppenbeleuchtung': 'step light',
  'treppenbeleuchtung': 'step light',
  'Wegbeleuchtung': 'padverlichting',
  'wegbeleuchtung': 'padverlichting',
  'Wandwäscher': 'wall washer',
  'wandwäscher': 'wall washer',
  'Flutlicht': 'flood light',
  'flutlicht': 'flood light',
  'Scheinwerfer': 'flood light',
  'scheinwerfer': 'flood light',
  
  // Fixture locations - Dutch
  'achter': 'achter',
  'Achter': 'achter',
  'midden': 'midden',
  'Midden': 'midden',
  'links': 'links',
  'Links': 'links',
  'rechts': 'rechts',
  'Rechts': 'rechts',
  'voor': 'voor',
  'Voor': 'voor',
  // Fixture locations - English
  'back': 'achter',
  'Back': 'achter',
  'rear': 'achter',
  'Rear': 'achter',
  'middle': 'midden',
  'Middle': 'midden',
  'center': 'midden',
  'Center': 'midden',
  'centre': 'midden',
  'Centre': 'midden',
  'left': 'links',
  'Left': 'links',
  'right': 'rechts',
  'Right': 'rechts',
  'front': 'voor',
  'Front': 'voor',
  // Fixture locations - Spanish
  'atrás': 'achter',
  'Atrás': 'achter',
  'trasera': 'achter',
  'Trasera': 'achter',
  'medio': 'midden',
  'Medio': 'midden',
  'centro': 'midden',
  'Centro': 'midden',
  'izquierda': 'links',
  'Izquierda': 'links',
  'izquierdo': 'links',
  'Izquierdo': 'links',
  'derecha': 'rechts',
  'Derecha': 'rechts',
  'derecho': 'rechts',
  'Derecho': 'rechts',
  'delante': 'voor',
  'Delante': 'voor',
  'frente': 'voor',
  'Frente': 'voor',
  // Fixture locations - French
  'arrière': 'achter',
  'Arrière': 'achter',
  'milieu': 'midden',
  'Milieu': 'midden',
  'gauche': 'links',
  'Gauche': 'links',
  'droite': 'rechts',
  'Droite': 'rechts',
  'devant': 'voor',
  'Devant': 'voor',
  // Fixture locations - German
  'hinten': 'achter',
  'Hinten': 'achter',
  'rückseite': 'achter',
  'Rückseite': 'achter',
  'mitte': 'midden',
  'Mitte': 'midden',
  'zentrum': 'midden',
  'Zentrum': 'midden',
  'vorne': 'voor',
  'Vorne': 'voor',
  'vorderseite': 'voor',
  'Vorderseite': 'voor',
  
  // Motion sensors - Dutch
  'pir': 'bewegingsmelder',
  'PIR': 'bewegingsmelder',
  'bewegingsmelder': 'bewegingsmelder',
  'Bewegingsmelder': 'bewegingsmelder',
  'bewegingssensor': 'bewegingsmelder',
  'Bewegingssensor': 'bewegingsmelder',
  // Motion sensors - English
  'motion detector': 'bewegingsmelder',
  'Motion detector': 'bewegingsmelder',
  'motion sensor': 'bewegingsmelder',
  'Motion sensor': 'bewegingsmelder',
  'presence detector': 'bewegingsmelder',
  'Presence detector': 'bewegingsmelder',
  'presence sensor': 'bewegingsmelder',
  'Presence sensor': 'bewegingsmelder',
  // Motion sensors - Spanish
  'detector de movimiento': 'bewegingsmelder',
  'Detector de movimiento': 'bewegingsmelder',
  'sensor de movimiento': 'bewegingsmelder',
  'Sensor de movimiento': 'bewegingsmelder',
  'detector de presencia': 'bewegingsmelder',
  'Detector de presencia': 'bewegingsmelder',
  // Motion sensors - French
  'détecteur de mouvement': 'bewegingsmelder',
  'Détecteur de mouvement': 'bewegingsmelder',
  'capteur de mouvement': 'bewegingsmelder',
  'Capteur de mouvement': 'bewegingsmelder',
  'détecteur de présence': 'bewegingsmelder',
  'Détecteur de présence': 'bewegingsmelder',
  // Motion sensors - German
  'bewegungsmelder': 'bewegingsmelder',
  'Bewegungsmelder': 'bewegingsmelder',
  'bewegungssensor': 'bewegingsmelder',
  'Bewegungssensor': 'bewegingsmelder',
  'präsenzmelder': 'bewegingsmelder',
  'Präsenzmelder': 'bewegingsmelder'
};

// Translation map from Dutch base terms to other languages
export const roomNameTranslations: Record<string, Record<Language, string>> = {
  'entree': { nl: 'entree', en: 'hall', es: 'entrada', fr: 'entrée', de: 'Halle' },
  'keuken': { nl: 'keuken', en: 'kitchen', es: 'cocina', fr: 'cuisine', de: 'Küche' },
  'eetkamer': { nl: 'eetkamer', en: 'dining room', es: 'comedor', fr: 'salle à manger', de: 'Esszimmer' },
  'woonkamer': { nl: 'woonkamer', en: 'living room', es: 'sala', fr: 'salon', de: 'Wohnzimmer' },
  'slaapkamer': { nl: 'slaapkamer', en: 'bedroom', es: 'dormitorio', fr: 'chambre', de: 'Schlafzimmer' },
  'badkamer': { nl: 'badkamer', en: 'bathroom', es: 'baño', fr: 'salle de bain', de: 'Badezimmer' },
  'toilet': { nl: 'toilet', en: 'toilet', es: 'aseo', fr: 'toilettes', de: 'Toilette' },
  'gang': { nl: 'gang', en: 'corridor', es: 'pasillo', fr: 'couloir', de: 'Flur' },
  'hal': { nl: 'hal', en: 'hallway', es: 'vestíbulo', fr: 'vestibule', de: 'Diele' },
  'berging': { nl: 'berging', en: 'storage', es: 'despensa', fr: 'débarras', de: 'Speicher' },
  'zolder': { nl: 'zolder', en: 'attic', es: 'ático', fr: 'grenier', de: 'Dachboden' },
  'kelder': { nl: 'kelder', en: 'basement', es: 'sótano', fr: 'cave', de: 'Keller' },
  'kantoor': { nl: 'kantoor', en: 'office', es: 'oficina', fr: 'bureau', de: 'Büro' },
  'serre': { nl: 'serre', en: 'conservatory', es: 'invernadero', fr: 'serre', de: 'Wintergarten' },
  'pantry': { nl: 'pantry', en: 'pantry', es: 'despensa', fr: 'garde-manger', de: 'Speisekammer' },
  'garage': { nl: 'garage', en: 'garage', es: 'garaje', fr: 'garage', de: 'Garage' },
  'terras': { nl: 'terras', en: 'terrace', es: 'terraza', fr: 'terrasse', de: 'Terrasse' },
  'balkon': { nl: 'balkon', en: 'balcony', es: 'balcón', fr: 'balcon', de: 'Balkon' },
  'loggia': { nl: 'loggia', en: 'loggia', es: 'logia', fr: 'loggia', de: 'Loggia' },
  'werkkamer': { nl: 'werkkamer', en: 'workshop', es: 'taller', fr: 'atelier', de: 'Werkstatt' },
  'hobbykamer': { nl: 'hobbykamer', en: 'hobby room', es: 'cuarto de hobby', fr: 'salle de hobby', de: 'Hobbyraum' },
  'wasruimte': { nl: 'wasruimte', en: 'laundry room', es: 'lavadero', fr: 'buanderie', de: 'Waschküche' },
  'wasplaats': { nl: 'wasplaats', en: 'utility room', es: 'lavadero', fr: 'buanderie', de: 'Waschküche' },
  'technische ruimte': { nl: 'technische ruimte', en: 'technical room', es: 'cuarto técnico', fr: 'local technique', de: 'Technikraum' },
  'meterkast': { nl: 'meterkast', en: 'meter cupboard', es: 'cuadro de contadores', fr: 'tableau électrique', de: 'Zählerkasten' },
  'cv-ruimte': { nl: 'cv-ruimte', en: 'boiler room', es: 'sala de calderas', fr: 'chaudière', de: 'Heizungsraum' },
  'wijnkelder': { nl: 'wijnkelder', en: 'wine cellar', es: 'bodega', fr: 'cave à vin', de: 'Weinkeller' },
  'sauna': { nl: 'sauna', en: 'sauna', es: 'sauna', fr: 'sauna', de: 'Sauna' },
  'jacuzzi': { nl: 'jacuzzi', en: 'jacuzzi', es: 'jacuzzi', fr: 'jacuzzi', de: 'Jacuzzi' },
  'zwembad': { nl: 'zwembad', en: 'swimming pool', es: 'piscina', fr: 'piscine', de: 'Schwimmbad' },
  'fitness': { nl: 'fitness', en: 'gym', es: 'gimnasio', fr: 'salle de sport', de: 'Fitnessraum' },
  'bioscoop': { nl: 'bioscoop', en: 'home cinema', es: 'cine en casa', fr: 'home cinéma', de: 'Heimkino' },
  'bibliotheek': { nl: 'bibliotheek', en: 'library', es: 'biblioteca', fr: 'bibliothèque', de: 'Bibliothek' },
  'speelkamer': { nl: 'speelkamer', en: 'playroom', es: 'cuarto de juegos', fr: 'salle de jeux', de: 'Spielzimmer' },
  'kinderkamer': { nl: 'kinderkamer', en: 'nursery', es: 'habitación de niños', fr: 'chambre d\'enfant', de: 'Kinderzimmer' },
  'gastenkammer': { nl: 'gastenkammer', en: 'guest room', es: 'habitación de invitados', fr: 'chambre d\'amis', de: 'Gästezimmer' },
  'logeerkamer': { nl: 'logeerkamer', en: 'guest room', es: 'habitación de invitados', fr: 'chambre d\'amis', de: 'Gästezimmer' },
  'dressing': { nl: 'dressing', en: 'dressing room', es: 'vestidor', fr: 'dressing', de: 'Ankleidezimmer' },
  'overloop': { nl: 'overloop', en: 'landing', es: 'rellano', fr: 'palier', de: 'Flur' }
};

export const fixtureTranslations: Record<string, Record<Language, string>> = {
  'lamp': { nl: 'lamp', en: 'light', es: 'luz', fr: 'lumière', de: 'Lampe' },
  'wandlamp': { nl: 'wandlamp', en: 'wall light', es: 'luz de pared', fr: 'lumière murale', de: 'Wandlampe' },
  'plafondlamp': { nl: 'plafondlamp', en: 'ceiling light', es: 'luz de techo', fr: 'plafonnier', de: 'Deckenleuchte' },
  'hanglamp': { nl: 'hanglamp', en: 'pendant light', es: 'lámpara colgante', fr: 'suspension', de: 'Hängelampe' },
  'staande lamp': { nl: 'staande lamp', en: 'floor lamp', es: 'lámpara de pie', fr: 'lampe sur pied', de: 'Stehlampe' },
  'bureaulamp': { nl: 'bureaulamp', en: 'desk lamp', es: 'lámpara de escritorio', fr: 'lampe de bureau', de: 'Schreibtischlampe' },
  'spots': { nl: 'spots', en: 'spotlights', es: 'focos', fr: 'spots', de: 'Spots' },
  'led strip': { nl: 'led strip', en: 'led strip', es: 'tira led', fr: 'bande led', de: 'LED-Streifen' },
  'opbouw': { nl: 'opbouw', en: 'surface mounted', es: 'superficie', fr: 'applique', de: 'Oberflächenmontage' },
  'buitenlamp': { nl: 'buitenlamp', en: 'outdoor light', es: 'luz exterior', fr: 'éclairage extérieur', de: 'Außenleuchte' },
  'tuinlamp': { nl: 'tuinlamp', en: 'garden light', es: 'luz de jardín', fr: 'éclairage de jardin', de: 'Gartenleuchte' },
  'wcd': { nl: 'wcd', en: 'socket', es: 'enchufe', fr: 'prise', de: 'Steckdose' },
  'cd': { nl: 'cd', en: 'junction box', es: 'caja de conexiones', fr: 'boîte de jonction', de: 'Anschlussdose' },
  'reserve': { nl: 'reserve', en: 'reserve', es: 'reserva', fr: 'réserve', de: 'Reserve' },
  // Zonwering
  'jalouzie': { nl: 'jalouzie', en: 'venetian blind', es: 'persiana veneciana', fr: 'store vénitienne', de: 'Jalousie' },
  'rolluik': { nl: 'rolluik', en: 'roller shutter', es: 'persiana enrollable', fr: 'volet roulant', de: 'Rollladen' },
  'zonnescherm': { nl: 'zonnescherm', en: 'awning', es: 'toldo', fr: 'store', de: 'Markise' },
  'screen': { nl: 'screen', en: 'screen', es: 'pantalla', fr: 'écran', de: 'Bildschirm' },
  'gordijn': { nl: 'gordijn', en: 'curtain', es: 'cortina', fr: 'rideau', de: 'Vorhang' },
  'rolgordijn': { nl: 'rolgordijn', en: 'roller blind', es: 'persiana enrollable', fr: 'store', de: 'Rollo' },
  'markies': { nl: 'markies', en: 'awning', es: 'toldo', fr: 'marquise', de: 'Markise' },
  'uitvalscherm': { nl: 'uitvalscherm', en: 'drop-arm awning', es: 'toldo de brazo', fr: 'store à bras', de: 'Korbmarkise' },
  'buitenjaloezie': { nl: 'buitenjaloezie', en: 'external venetian blind', es: 'persiana exterior', fr: 'store extérieure', de: 'Außenjalousie' },
  'vitrage': { nl: 'vitrage', en: 'voile curtain', es: 'visillo', fr: 'voile', de: 'Gardine' },
  'lamellendak': { nl: 'lamellendak', en: 'louvered roof', es: 'techo de celosía', fr: 'toit à lames', de: 'Lamellendach' },
  'dakraam': { nl: 'dakraam', en: 'skylight', es: 'claraboya', fr: 'velux', de: 'Dachfenster' },
  'roldek': { nl: 'roldek', en: 'rolling cover', es: 'cubierta enrollable', fr: 'couverture roulante', de: 'Rolladen' },
  // Extra lampen
  'tafellamp': { nl: 'tafellamp', en: 'table lamp', es: 'lámpara de mesa', fr: 'lampe de table', de: 'Tischlampe' },
  'vloerlamp': { nl: 'vloerlamp', en: 'floor lamp', es: 'lámpara de pie', fr: 'lampe sur pied', de: 'Stehlampe' },
  'sierlamp': { nl: 'sierlamp', en: 'decorative lamp', es: 'lámpara decorativa', fr: 'lampe décorative', de: 'Dekoleuchte' },
  'leeslamp': { nl: 'leeslamp', en: 'reading lamp', es: 'lámpara de lectura', fr: 'lampe de lecture', de: 'Leselampe' },
  'inbouwspot': { nl: 'inbouwspot', en: 'recessed spotlight', es: 'spot empotrado', fr: 'spot encastré', de: 'Einbaustrahler' },
  'buitenspot': { nl: 'buitenspot', en: 'outdoor spotlight', es: 'foco exterior', fr: 'spot extérieur', de: 'Außenstrahler' },
  'schemerlamp': { nl: 'schemerlamp', en: 'table lamp', es: 'lámpara de mesa', fr: 'lampe de table', de: 'Tischlampe' },
  'nachtlamp': { nl: 'nachtlamp', en: 'night light', es: 'luz nocturna', fr: 'veilleuse', de: 'Nachtlicht' },
  'downlight': { nl: 'downlight', en: 'downlight', es: 'luz descendente', fr: 'éclairage descendant', de: 'Downlight' },
  'uplight': { nl: 'uplight', en: 'uplight', es: 'luz ascendente', fr: 'éclairage montant', de: 'Uplight' },
  'track light': { nl: 'track light', en: 'track light', es: 'rieles', fr: 'rail lumineux', de: 'Schienenbeleuchtung' },
  'linear light': { nl: 'linear light', en: 'linear light', es: 'luz lineal', fr: 'éclairage linéaire', de: 'Lineare Beleuchtung' },
  'panel light': { nl: 'panel light', en: 'panel light', es: 'luz de panel', fr: 'panneau lumineux', de: 'Panelbeleuchtung' },
  'cove light': { nl: 'cove light', en: 'cove light', es: 'luz de cornisa', fr: 'éclairage de corniche', de: 'Koffenbeleuchtung' },
  'accent light': { nl: 'accent light', en: 'accent light', es: 'luz de acento', fr: 'éclairage d\'accent', de: 'Akzentbeleuchtung' },
  'task light': { nl: 'task light', en: 'task light', es: 'luz de trabajo', fr: 'éclairage de travail', de: 'Arbeitsbeleuchtung' },
  'emergency light': { nl: 'emergency light', en: 'emergency light', es: 'luz de emergencia', fr: 'éclairage d\'urgence', de: 'Notbeleuchtung' },
  'exit light': { nl: 'exit light', en: 'exit light', es: 'luz de salida', fr: 'éclairage de sortie', de: 'Ausgangsbeleuchtung' },
  'step light': { nl: 'step light', en: 'step light', es: 'luz de escalera', fr: 'éclairage d\'escalier', de: 'Treppenbeleuchtung' },
  'padverlichting': { nl: 'padverlichting', en: 'path light', es: 'luz de sendero', fr: 'éclairage de sentier', de: 'Wegbeleuchtung' },
  'wall washer': { nl: 'wall washer', en: 'wall washer', es: 'lavado de pared', fr: 'lavage de mur', de: 'Wandwäscher' },
  'flood light': { nl: 'flood light', en: 'flood light', es: 'proyector', fr: 'projecteur', de: 'Flutlicht' },
  // Fixture locations
  'achter': { nl: 'achter', en: 'back', es: 'atrás', fr: 'arrière', de: 'hinten' },
  'midden': { nl: 'midden', en: 'middle', es: 'medio', fr: 'milieu', de: 'mitte' },
  'links': { nl: 'links', en: 'left', es: 'izquierda', fr: 'gauche', de: 'links' },
  'rechts': { nl: 'rechts', en: 'right', es: 'derecha', fr: 'droite', de: 'rechts' },
  'voor': { nl: 'voor', en: 'front', es: 'delante', fr: 'devant', de: 'vorne' },
  // Motion sensors
  'bewegingsmelder': { nl: 'bewegingsmelder', en: 'motion detector', es: 'detector de movimiento', fr: 'détecteur de mouvement', de: 'Bewegungsmelder' }
};

/** Floors, directions, main functions – for group names (hoofdfunctie + verdieping + vleugel/locatie) */
const groupNamePartTranslations: Record<string, Record<Language, string>> = {
  'begane grond': { nl: 'begane grond', en: 'ground floor', es: 'planta baja', fr: 'rez-de-chaussée', de: 'Erdgeschoss' },
  'beganegrond': { nl: 'begane grond', en: 'ground floor', es: 'planta baja', fr: 'rez-de-chaussée', de: 'Erdgeschoss' },
  '1e verdieping': { nl: '1e verdieping', en: '1st floor', es: '1ª planta', fr: '1er étage', de: '1. Stock' },
  '2e verdieping': { nl: '2e verdieping', en: '2nd floor', es: '2ª planta', fr: '2e étage', de: '2. Stock' },
  '3e verdieping': { nl: '3e verdieping', en: '3rd floor', es: '3ª planta', fr: '3e étage', de: '3. Stock' },
  'kelder': { nl: 'kelder', en: 'basement', es: 'sótano', fr: 'cave', de: 'Keller' },
  'zolder': { nl: 'zolder', en: 'attic', es: 'ático', fr: 'grenier', de: 'Dachboden' },
  'noord': { nl: 'noord', en: 'north', es: 'norte', fr: 'nord', de: 'Norden' },
  'zuid': { nl: 'zuid', en: 'south', es: 'sur', fr: 'sud', de: 'Süden' },
  'oost': { nl: 'oost', en: 'east', es: 'este', fr: 'est', de: 'Osten' },
  'west': { nl: 'west', en: 'west', es: 'oeste', fr: 'ouest', de: 'Westen' },
  'dimmen': { nl: 'dimmen', en: 'dimming', es: 'regulador', fr: 'variateur', de: 'Dimmer' },
  'schakelen': { nl: 'schakelen', en: 'switch', es: 'interruptor', fr: 'interrupteur', de: 'Schalter' },
  'dimmen / schakelen': { nl: 'dimmen / schakelen', en: 'dimming / switch', es: 'regulador / interruptor', fr: 'variateur / interrupteur', de: 'Dimmer / Schalter' },
  'verdieping': { nl: 'verdieping', en: '1st floor', es: '1ª planta', fr: '1er étage', de: '1. Stock' },
  'jalouzie': { nl: 'jalouzie', en: 'venetian blind', es: 'persiana', fr: 'store', de: 'Jalousie' },
  'rolluik': { nl: 'rolluik', en: 'roller shutter', es: 'persiana enrollable', fr: 'volet roulant', de: 'Rollladen' },
  'klimaat': { nl: 'klimaat', en: 'climate', es: 'clima', fr: 'climat', de: 'Klima' },
  'hvac': { nl: 'hvac', en: 'hvac', es: 'hvac', fr: 'hvac', de: 'hvac' }
};

/** Maps variants (any language) to Dutch key for group-name parts (floors, directions, categories) */
const groupNamePartMap: Record<string, string> = {
  'ground floor': 'begane grond', 'first floor': '1e verdieping', '1st floor': '1e verdieping',
  'second floor': '2e verdieping', '2nd floor': '2e verdieping', 'third floor': '3e verdieping', '3rd floor': '3e verdieping',
  'planta baja': 'begane grond', 'rez-de-chaussée': 'begane grond', 'erdgeschoss': 'begane grond',
  'north': 'noord', 'south': 'zuid', 'east': 'oost', 'west': 'west',
  'norte': 'noord', 'sur': 'zuid', 'este': 'oost', 'oeste': 'west',
  'nord': 'noord', 'sud': 'zuid', 'est': 'oost', 'ouest': 'west',
  'dimmer': 'dimmen', 'dimming': 'dimmen', 'switch': 'schakelen',
  'dimmer / switch': 'dimmen / schakelen', 'dimming / switch': 'dimmen / schakelen',
  'dimmen/schakelen': 'dimmen / schakelen', 'dimmer/switch': 'dimmen / schakelen', 'dimming/switch': 'dimmen / schakelen',
  'venetian blind': 'jalouzie', 'roller shutter': 'rolluik', 'climate': 'klimaat'
};

/**
 * Translates a group name for display. Translates words that exist in the database
 * (hoofdfunctie, verdieping, vleugel/locatie). Ensures no duplicate words in output.
 */
export const translateGroupNameForDisplay = (name: string, lang: Language): string => {
  if (!name || !String(name).trim()) return name;
  const raw = String(name).trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, ' ').trim();

  type Entry = { phrase: string; key: string; source: 'group' | 'room' };
  const entries: Entry[] = [];

  const groupKeys = Object.keys(groupNamePartTranslations);
  const groupKeySet = new Set(groupKeys);
  for (const k of groupKeys) {
    if (k.includes(' ')) entries.push({ phrase: k, key: k, source: 'group' });
  }
  for (const k of groupKeys) {
    if (!k.includes(' ')) entries.push({ phrase: k, key: k, source: 'group' });
  }
  for (const [variant, key] of Object.entries(groupNamePartMap)) {
    if (!groupKeySet.has(key)) continue;
    const v = variant.toLowerCase().trim();
    if (entries.some(e => e.phrase === v)) continue;
    entries.push({ phrase: v, key, source: 'group' });
  }

  const roomKeys = Object.keys(roomNameTranslations);
  for (const k of roomKeys) {
    if (k.includes(' ')) entries.push({ phrase: k, key: k, source: 'room' });
  }
  for (const k of roomKeys) {
    if (!k.includes(' ')) entries.push({ phrase: k, key: k, source: 'room' });
  }
  for (const [variant, key] of Object.entries(userInputTranslationMap)) {
    if (!roomNameTranslations[key]) continue;
    const v = variant.toLowerCase().trim();
    if (entries.some(e => e.phrase === v)) continue;
    entries.push({ phrase: v, key, source: 'room' });
  }

  entries.sort((a, b) => b.phrase.length - a.phrase.length);

  const result: string[] = [];
  const seen = new Set<string>();
  let rest = normalized;

  while (rest) {
    let matched = false;
    for (const { phrase, key, source } of entries) {
      const transl = source === 'group'
        ? groupNamePartTranslations[key]?.[lang]
        : roomNameTranslations[key]?.[lang];
      if (!transl) continue;
      const translLower = transl.toLowerCase();
      if (rest === phrase || rest.startsWith(phrase + ' ')) {
        if (!seen.has(translLower)) {
          result.push(transl);
          seen.add(translLower);
        }
        rest = rest.slice(phrase.length).replace(/^\s+/, '');
        matched = true;
        break;
      }
    }
    if (!matched) {
      const idx = rest.indexOf(' ');
      const word = idx >= 0 ? rest.slice(0, idx) : rest;
      rest = idx >= 0 ? rest.slice(idx + 1) : '';
      const wLower = word.toLowerCase();
      if (word && !seen.has(wLower)) {
        result.push(word);
        seen.add(wLower);
      }
    }
  }

  const joined = result.join(' ').trim();
  if (!joined) return raw;
  return joined.charAt(0).toUpperCase() + joined.slice(1);
};

/**
 * Translates user input (room names and fixture names) to the target language
 * @param value The user input value to translate
 * @param targetLang The target language to translate to
 * @param type 'roomName' or 'fixture' to determine which translation map to use
 * @returns The translated value, or the original value if no translation found
 */
export const translateUserInput = (value: string, targetLang: Language, type: 'roomName' | 'fixture'): string => {
  if (!value || !value.trim()) return value;
  
  const normalizedValue = value.toLowerCase().trim();
  
  // Handle "ledstrip" without space -> convert to "led strip" first
  const processedValue = normalizedValue.replace(/^ledstrip/, 'led strip').replace(/\bledstrip\b/g, 'led strip');
  
  // First, try to find the value in the user input translation map
  const baseKey = userInputTranslationMap[processedValue];
  
  if (baseKey) {
    // Found a base key, now translate it to the target language
    if (type === 'roomName' && roomNameTranslations[baseKey]) {
      return roomNameTranslations[baseKey][targetLang];
    } else if (type === 'fixture' && fixtureTranslations[baseKey]) {
      return fixtureTranslations[baseKey][targetLang];
    }
  }
  
  // If not found in map, try direct lookup in translation dictionaries
  if (type === 'roomName' && roomNameTranslations[processedValue]) {
    return roomNameTranslations[processedValue][targetLang];
  } else if (type === 'fixture' && fixtureTranslations[processedValue]) {
    return fixtureTranslations[processedValue][targetLang];
  }
  
  // Try partial match: split by space and try to translate the first word(s)
  // This handles cases like "gordijn links", "gordijn rechts", "spots opbouw"
  const words = processedValue.split(/\s+/);
  if (words.length > 1) {
    // Try to match the first word or first two words
    for (let i = words.length; i >= 1; i--) {
      const firstPart = words.slice(0, i).join(' ');
      const remainingPart = words.slice(i).join(' ');
      
      // Check if first part is in translation map
      const firstPartBaseKey = userInputTranslationMap[firstPart];
      if (firstPartBaseKey) {
        const translations = type === 'roomName' ? roomNameTranslations : fixtureTranslations;
        if (translations[firstPartBaseKey]) {
          const translatedFirstPart = translations[firstPartBaseKey][targetLang];
          // If there's a remaining part, translate it word by word and append it
          if (remainingPart) {
            const translatedRemaining = translateUserInput(remainingPart, targetLang, type);
            return `${translatedFirstPart} ${translatedRemaining}`;
          }
          return translatedFirstPart;
        }
      }
      
      // Also try direct lookup in translation dictionaries
      const translations = type === 'roomName' ? roomNameTranslations : fixtureTranslations;
      if (translations[firstPart]) {
        const translatedFirstPart = translations[firstPart][targetLang];
        // If there's a remaining part, translate it word by word and append it
        if (remainingPart) {
          const translatedRemaining = translateUserInput(remainingPart, targetLang, type);
          return `${translatedFirstPart} ${translatedRemaining}`;
        }
        return translatedFirstPart;
      }
    }
  }
  
  // If no translation found, return original value
  return value;
};

/**
 * Gets the standard (Dutch) name from any translated user input value
 * This is the reverse of translateUserInput - it finds the Dutch base key from any language variant
 * @param value The translated value (in any language)
 * @param type 'roomName' or 'fixture' to determine which translation map to use
 * @returns The standard (Dutch) value, or the original value if no standard found
 */
export const getStandardUserInput = (value: string, type: 'roomName' | 'fixture'): string => {
  if (!value || !value.trim()) return value;
  
  const normalizedValue = value.toLowerCase().trim();
  
  // Handle "ledstrip" without space -> convert to "led strip" first
  const processedValue = normalizedValue.replace(/^ledstrip/, 'led strip').replace(/\bledstrip\b/g, 'led strip');
  
  // First, try to find the value in the user input translation map (which maps variants to base keys)
  const baseKey = userInputTranslationMap[processedValue];
  if (baseKey) {
    return baseKey; // Return the base key (Dutch)
  }
  
  // If not found in map, check if it's already a base key (Dutch)
  const translations = type === 'roomName' ? roomNameTranslations : fixtureTranslations;
  if (translations[processedValue]) {
    return processedValue; // Already a base key
  }
  
  // Try to find it in the translation dictionaries by searching all languages
  for (const [baseKey, translationData] of Object.entries(translations)) {
    for (const lang of ['nl', 'en', 'es', 'fr', 'de'] as const) {
      if (translationData[lang]?.toLowerCase().trim() === processedValue) {
        return baseKey; // Found in translations, return base key
      }
    }
  }
  
  // Try partial match: split by space and try to find the first word(s)
  // This handles cases like "gordijn links", "gordijn rechts", "spots opbouw"
  const words = processedValue.split(/\s+/);
  if (words.length > 1) {
    // Try to match the first word or first two words
    for (let i = words.length; i >= 1; i--) {
      const firstPart = words.slice(0, i).join(' ');
      const remainingPart = words.slice(i).join(' ');
      
      // Check if first part is in translation map
      const firstPartBaseKey = userInputTranslationMap[firstPart];
      if (firstPartBaseKey) {
        // If there's a remaining part, append it
        if (remainingPart) {
          return `${firstPartBaseKey} ${remainingPart}`;
        }
        return firstPartBaseKey;
      }
      
      // Also try direct lookup in translation dictionaries
      if (translations[firstPart]) {
        // If there's a remaining part, append it
        if (remainingPart) {
          return `${firstPart} ${remainingPart}`;
        }
        return firstPart;
      }
      
      // Try to find first part in translation dictionaries by searching all languages
      for (const [baseKey, translationData] of Object.entries(translations)) {
        for (const lang of ['nl', 'en', 'es', 'fr', 'de'] as const) {
          if (translationData[lang]?.toLowerCase().trim() === firstPart) {
            // If there's a remaining part, append it
            if (remainingPart) {
              return `${baseKey} ${remainingPart}`;
            }
            return baseKey;
          }
        }
      }
    }
  }
  
  // If no standard found, return original value
  return value;
};

/**
 * Normalize extra-object name to a standard (Dutch) form.
 * Tries room names, then fixtures, then KNX object names. Works with input in any language.
 */
export const getStandardExtraObjectName = (name: string): string => {
  if (!name || !String(name).trim()) return name;
  const norm = String(name).trim().toLowerCase();
  const room = getStandardUserInput(norm, 'room');
  if (room !== norm) return room;
  const fixture = getStandardUserInput(norm, 'fixture');
  if (fixture !== norm) return fixture;
  return getStandardObjectName(name);
};

/**
 * Translate extra-object name for display. Tries room names, then fixtures, then fixed addresses
 * (centraal, scènes, alles uit, welkom, …), then KNX object names. Supports input in any language.
 */
export const translateExtraObjectNameForDisplay = (name: string, lang: Language): string => {
  if (!name || !String(name).trim()) return name;
  const trimmed = String(name).trim();
  const r = translateUserInput(trimmed, lang, 'room');
  if (r.toLowerCase() !== trimmed.toLowerCase()) return r;
  const f = translateUserInput(trimmed, lang, 'fixture');
  if (f.toLowerCase() !== trimmed.toLowerCase()) return f;
  const fixed = translateFixedAddressName(trimmed, lang);
  if (fixed.toLowerCase() !== trimmed.toLowerCase()) return fixed;
  return translateObjectName(trimmed, lang);
};
