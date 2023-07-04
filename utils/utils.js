import fs from "fs"

function transformString(input) {
  let transformed = input.toLowerCase();

  // Replace whitespace with hyphens
  transformed = transformed.replace(/\s+/g, '-');

  // Replace special characters
  const replacements = {
    'đ': 'dj',
    'š': 's',
    'ž': 'z',
    'ć': 'c',
    'č': 'c'
  };

  transformed = transformed.replace(/[đšžćč]/g, match => replacements[match]);

  return transformed;
}

function getCategoryId(name) {
  const categoryMap = {
    "alati-i-orudja": "969",
    "antikviteti": "186",
    "asesoari": "863",
    "audio": "1",
    "audio-vinili-cd-i-kasete": "1176",
    "automobili": "2013",
    "automobili-delovi-i-alati": "591",
    "automobili-oprema": "1251",
    "bela-tehnika-i-kucni-aparati": "15",
    "bicikli": "912",
    "bicikli-delovi-i-oprema": "2253",
    "casopisi-i-stripovi": "1296",
    "dvoriste-i-basta": "620",
    "elektro-i-rasveta": "2536",
    "elektronika-i-komponente": "821",
    "etno-stvari": "2576",
    "fitnes-i-vezbanje": "2628",
    "foto-aparati-i-kamere": "16",
    "gradjevinarstvo": "7",
    "igracke-i-igre": "1157",
    "industrijska-oprema": "37",
    "knjige": "8",
    "kolekcionarstvo": "584",
    "kompjuteri-desktop": "10",
    "kompjuteri-laptop-i-tablet": "1221",
    "konzole-i-igrice": "1036",
    "kucni-ljubimci": "14",
    "kucni-ljubimci-oprema": "2475",
    "kupatilo-i-oprema": "2446",
    "lov-i-ribolov": "1284",
    "mama-i-beba": "18",
    "mobilni-tel-oprema-i-delovi": "1017",
    "mobilni-telefoni": "23",
    "motocikli": "21",
    "motocikli-oprema-i-delovi": "946",
    "muzika-i-instrumenti": "22",
    "nakit-satovi-i-dragocenosti": "213",
    "namestaj": "1268",
    "nega-lica-tela-i-ulepsavanje": "20",
    "nekretnine-iznajmljivanje": "25",
    "nekretnine-kupoprodaja": "26",
    "obuca-decja": "1384",
    "obuca-muska": "1078",
    "obuca-zenska": "1077",
    "odeca-decja": "1383",
    "odeca-muska": "29",
    "odeca-zenska": "743",
    "odmor-u-srbiji": "2392",
    "oprema-u-zdravstvu": "539",
    "oprema-za-poslovanje": "9",
    "plovni-objekti": "31",
    "poljoprivreda": "501",
    "poljoprivreda-domace-zivotinje": "2237",
    "rucni-radovi": "2590",
    "skolski-pribor-i-udzbenici": "2293",
    "sport-i-razonoda": "32",
    "transportna-vozila": "2329",
    "transportna-vozila-delovi-i-oprema": "2492",
    "tv-i-video": "1054",
    "ugostiteljstvo-oprema": "1318",
    "umetnicka-dela-i-materijali": "2695",
    "uredjenje-kuce": "17",
    "usluge": "36",
    "poslovi": "36"
  };

  return categoryMap[name];
}

function saveToFolder(data, filePath) {
  try {
    const jsonData = JSON.stringify(data);

    fs.writeFileSync(filePath, jsonData);

    console.log(`Data saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

function extractPrice(price) {
  const regex = /(\d+(?:\.\d+)?)\s*(\D+)/;
  const match = price.match(regex);

  if (match && match.length === 3) {
    const extractedPrice = match[1];
    const currency = match[2];
    return `${extractedPrice} ${currency}`;
  }

  return null;
}

export {
  transformString,
  getCategoryId,
  saveToFolder,
  extractPrice
}