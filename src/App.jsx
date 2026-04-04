import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Globe from "react-globe.gl";
import severusLogo from "./logo.png";
import ResearchSection from "./ResearchSection.jsx";

// ── THEMES ────────────────────────────────────────────────────
const DARK = {
  name:"dark", bg:"#141210", surface:"#1C1916", card:"#221F1A", cardHov:"#2A2620",
  border:"#2E2A24", accent:"#FF5722", accentDim:"#FF572218", accentMid:"#CC3D00",
  slate:"#708090", info:"#009AD8", success:"#4CAF7D", danger:"#E03030",
  ink:"#FCF9F7", inkMid:"#C8BDB5", inkLight:"#8A7D74", inkFaint:"#3D3530",
};
const LIGHT = {
  name:"light", bg:"#FAFAF8", surface:"#F2F0EB", card:"#FFFFFF", cardHov:"#F7F5F0",
  border:"#E4DDD4", accent:"#CC3D00", accentDim:"#CC3D0012", accentMid:"#A83000",
  slate:"#4A6070", info:"#0077A8", success:"#2E7D4F", danger:"#B02020",
  ink:"#231E18", inkMid:"#5C5248", inkLight:"#8C7F72", inkFaint:"#D0C8BE",
};

// ── ERAS ──────────────────────────────────────────────────────
const ERAS = [
  { id:"prehistory",   label:"Prehistory",          year:-315000 },
  { id:"outafrica",    label:"Out of Africa",        year:-70000  },
  { id:"neolithic",    label:"First Civilizations",  year:-10000  },
  { id:"firstkings",   label:"Ancient World",        year:-3100   },
  { id:"classical",    label:"Classical Age",        year:-800    },
  { id:"medieval",     label:"Medieval Period",      year:500     },
  { id:"empires",      label:"Age of Empires",       year:1200    },
  { id:"contact",      label:"Age of Exploration",   year:1400    },
  { id:"slavetrade",   label:"Colonialism",          year:1500    },
  { id:"colonial",     label:"Revolutions",          year:1750    },
  { id:"independence", label:"World Wars",           year:1900    },
  { id:"present",      label:"Modern Era",           year:1945    },
];

const TYPE_META = {
  origin:        { label:"Human Origins",          color:"#FFD700" },
  civilization:  { label:"Ancient Civilization",   color:"#FF5722" },
  indigenous:    { label:"Indigenous Peoples",     color:"#009AD8" },
  diaspora:      { label:"Diaspora & Migration",   color:"#4CAF7D" },
  accountability:{ label:"Power & Accountability", color:"#E03030" },
  world:         { label:"World Civilization",     color:"#9B59B6" },
  empire:        { label:"Empire",                 color:"#E6A817" },
  islamic:       { label:"Islamic World",          color:"#26A69A" },
  wiki:          { label:"Found Online",           color:"#00BCD4" },
};

// ── LOCATIONS ─────────────────────────────────────────────────
const LOCATIONS = [
  { id:"rift",     name:"Great Rift Valley",              region:"East Africa",          lat:3.5,  lon:36.5, type:"origin",         startYear:-315000, era:"315,000 BCE", wikiTitle:"Omo_remains",         summary:"The birthplace of all humanity. Omo remains date to 195,000 BCE. Every human alive traces ancestry here.", facts:["Omo remains: oldest confirmed Homo sapiens fossils, 195,000 BCE","Lucy (3.2M years old) found at Hadar, Ethiopia","Africa holds more genetic diversity than rest of world combined","First stone tools (Oldowan) created here 2.6 million years ago"] },
  { id:"jebel",    name:"Jebel Irhoud",                   region:"Morocco",              lat:32,   lon:-9,   type:"origin",         startYear:-315000, era:"315,000 BCE", wikiTitle:"Jebel_Irhoud",        summary:"315,000-year-old skulls discovered in 2017 proving Homo sapiens emerged across Africa, not in a single location.", facts:["315,000-year-old skulls — oldest Homo sapiens found","Rewrote the timeline of human evolution in 2017","Shows modern humans emerged pan-Africa","Stone tools and fire evidence found alongside fossils"] },
  { id:"khoisan",  name:"San & Khoikhoi Peoples",         region:"Southern Africa",      lat:-22,  lon:21,   type:"indigenous",     startYear:-150000, era:"150,000 BCE", wikiTitle:"San_people",          summary:"The San carry the deepest-rooted genetic lineage on Earth, diverging 150,000+ years ago. Their click languages and 30,000-year rock art are humanity's oldest continuous cultural practices.", facts:["Oldest continuous human culture on Earth","Click languages among Earth's most ancient","Tsodilo Hills: 4,500+ rock paintings over 30,000 years — UNESCO","Were once the most widespread people across all of Africa"] },
  { id:"hadza",    name:"Hadza People",                   region:"Tanzania",             lat:-4,   lon:35,   type:"indigenous",     startYear:-50000,  era:"50,000 BCE",  wikiTitle:"Hadza_people",        summary:"One of Earth's last hunter-gatherer societies. ~1,300 people remain, living adjacent to Olduvai Gorge.", facts:["~1,300 people — one of last true hunter-gatherer societies","Language is a complete isolate — related to no other","Most diverse gut microbiome of any studied population","Live adjacent to Olduvai Gorge where human evolution began"] },
  { id:"pygmy",    name:"Central African Forest Peoples", region:"Congo Basin",          lat:1,    lon:18,   type:"indigenous",     startYear:-60000,  era:"60,000 BCE",  wikiTitle:"African_Pygmies",     summary:"The Aka, Baka and Mbuti represent ancient lineages diverging 60,000+ years ago with extraordinary forest knowledge.", facts:["Multiple lineages diverged 60,000+ years ago","Mbuti polyphonic hocket singing — UNESCO recognised","Knowledge of 10,000+ forest species","Congo Basin: Earth's second-largest tropical rainforest"] },
  { id:"andaman",  name:"Andamanese Peoples",             region:"Bay of Bengal",        lat:12.4, lon:92.9, type:"indigenous",     startYear:-70000,  era:"70,000 BCE",  wikiTitle:"Andamanese_people",   summary:"Direct descendants of the first humans to leave Africa. The Sentinelese reject all contact. Great Andamanese reduced from 8,000 to 59 by colonization.", facts:["Haplogroup D*: oldest Out-of-Africa lineage alive","50,000+ years of continuous island habitation","Sentinelese: protected by Indian law","Great Andamanese: reduced from 8,000 to 59 by colonization"] },
  { id:"melanesia",name:"Melanesian Peoples",             region:"Pacific",              lat:-6,   lon:147,  type:"indigenous",     startYear:-65000,  era:"65,000 BCE",  wikiTitle:"Melanesians",         summary:"Among first humans to leave Africa, crossing open ocean 65,000 years ago. They carry 4–6% Denisovan DNA unique on Earth.", facts:["Among first humans to leave Africa (~65,000 BCE)","Carry 4–6% Denisovan DNA — unique to Pacific peoples","PNG: 850+ languages — 12% of all Earth's languages","Independently developed agriculture ca. 7,000 BCE"] },
  { id:"egypt",    name:"Ancient Egypt — Kemet",          region:"North Africa",         lat:27,   lon:30.5, type:"civilization",   startYear:-3100,   era:"3100 BCE",    wikiTitle:"Ancient_Egypt",       summary:"'Kemet' — the Black Land. Mathematics, medicine, architecture and theology that laid the foundation for Western civilisation.", facts:["Kemet = 'the Black Land' — Egypt's own name","Great Pyramid: tallest structure on Earth for 3,800 years","Ebers Papyrus (1550 BCE): world's oldest medical text","Egyptian theology shaped Greek, Roman and Christian traditions"] },
  { id:"kush",     name:"Kingdom of Kush",                region:"Sudan",                lat:18.3, lon:33.7, type:"civilization",   startYear:-2500,   era:"2500 BCE",    wikiTitle:"Kingdom_of_Kush",     summary:"Built more pyramids than Egypt. The 25th Dynasty saw Nubian Black Pharaohs conquer and rule all of Egypt 744–656 BCE.", facts:["200+ pyramids — more than Egypt — still standing in Sudan","25th Dynasty: Nubian Black Pharaohs ruled Egypt 744–656 BCE","Meroitic script: Africa's earliest independent writing system","Major iron-smelting hub exporting technology across Africa"] },
  { id:"axum",     name:"Kingdom of Axum",                region:"Ethiopia & Eritrea",   lat:14.1, lon:38.7, type:"civilization",   startYear:100,     era:"100 CE",      wikiTitle:"Kingdom_of_Aksum",    summary:"One of the ancient world's four great powers, trading with Rome, Persia, India and China. Adopted Christianity in 330 CE.", facts:["Traded directly with Rome, Persia, Arabia and India","Adopted Christianity 330 CE — one of world's first","Ge'ez script: still in use in Ethiopia today","Obelisks of Axum stand up to 33 metres tall"] },
  { id:"mali",     name:"Mali Empire & Timbuktu",         region:"West Africa",          lat:13.5, lon:-8,   type:"civilization",   startYear:1235,    era:"1235 CE",     wikiTitle:"Mali_Empire",         summary:"Under Mansa Musa I, the wealthiest nation on Earth. His 1324 pilgrimage crashed Egypt's gold market. Timbuktu held 700,000+ manuscripts.", facts:["Mansa Musa I: likely wealthiest individual in recorded history","1324 Mecca pilgrimage crashed gold markets for 10 years","Sankore University: 25,000 students — predates Oxford","700,000+ manuscripts in Timbuktu libraries"] },
  { id:"songhai",  name:"Songhai Empire",                 region:"West Africa",          lat:16,   lon:1,    type:"civilization",   startYear:1375,    era:"1375 CE",     wikiTitle:"Songhai_Empire",      summary:"The largest empire in West African history, controlling all trans-Saharan gold and salt trade routes.", facts:["Largest empire in West African history","Stretched from Atlantic coast to modern Nigeria","Timbuktu: leading centre of Islamic scholarship","Controlled all trans-Saharan gold and salt routes"] },
  { id:"zimbabwe", name:"Great Zimbabwe",                 region:"Southern Africa",      lat:-20.3,lon:30.9, type:"civilization",   startYear:900,     era:"900 CE",      wikiTitle:"Great_Zimbabwe",      summary:"Sub-Saharan Africa's largest pre-colonial stone structure, built without mortar, trading with Persia, India and China.", facts:["Largest unmortared stone structure in sub-Saharan Africa","Traded with Persia, India and Song Dynasty China","Population of ~18,000 at its peak","Colonial denial of African origins was weaponised to justify land seizure"] },
  { id:"benin",    name:"Kingdom of Benin",               region:"Nigeria",              lat:6.3,  lon:5.6,  type:"civilization",   startYear:1180,    era:"1180 CE",     wikiTitle:"Benin_Kingdom",       summary:"The Benin Bronzes — 13th-century lost-wax castings — are among the finest art ever produced. 3,000+ were looted by Britain in 1897.", facts:["Benin Bronzes: 13th-century bronze casting rivalling Renaissance Europe","Diplomatic contact with Portugal from 1485 CE","1897 British Punitive Expedition: 3,000+ artworks looted","Repatriation remains a major cultural justice cause"] },
  { id:"swahili",  name:"Swahili Coast City-States",      region:"East Africa Coast",    lat:-6.2, lon:39.2, type:"civilization",   startYear:700,     era:"700 CE",      wikiTitle:"Swahili_coast",       summary:"Kilwa Kisiwani called 'one of the most beautiful cities in the world' by Ibn Battuta in 1331, trading with Arabia, Persia, India and China.", facts:["Ibn Battuta (1331): called Kilwa 'one of the most beautiful cities'","Traded directly with Song and Ming Dynasty China","Swahili: Bantu grammar + Arabic/Persian/Indian vocabulary","Great Mosque of Kilwa: largest medieval mosque in sub-Saharan Africa"] },
  { id:"yoruba",   name:"Yoruba — Ile-Ife",               region:"Nigeria",              lat:7.5,  lon:4.5,  type:"civilization",   startYear:-500,    era:"500 BCE",     wikiTitle:"Yoruba_people",       summary:"Ife brass heads display portraiture so sophisticated Europeans refused to believe Africans created them. Yoruba religion survives on 4 continents.", facts:["Ife brass heads: naturalistic art still studied in art history","Oyo Empire extended to modern Ghana and Togo","Candomblé, Santería, Orisha all trace to Yoruba","Ifá divination on UNESCO Intangible Cultural Heritage list"] },
  { id:"caribbean",name:"Caribbean — First Black Republic",region:"Caribbean",           lat:18.5, lon:-72.5,type:"diaspora",       startYear:1503,    era:"1503 CE",     wikiTitle:"Haitian_Revolution",  summary:"Haiti became the FIRST BLACK REPUBLIC on January 1, 1804 — defeating Napoleon's 40,000-strong army. The only successful slave revolution in history.", facts:["Haiti: first Black republic in history, January 1, 1804","Only successful slave revolution in history","Defeated Napoleon's professional army over 13 years","Vodou preserves West African Fon/Ewe religion intact"] },
  { id:"brazil",   name:"Brazil — African Diaspora",      region:"Brazil",               lat:-12.9,lon:-38.3,type:"diaspora",       startYear:1502,    era:"1502 CE",     wikiTitle:"African_Brazilians",  summary:"Brazil received 4.9 million enslaved Africans — 46% of the ENTIRE transatlantic slave trade. Candomblé preserves Yoruba religion almost completely intact.", facts:["4.9 million enslaved Africans — 46% of entire transatlantic trade","Candomblé: preserves Yoruba, Fon and Bantu religion intact","Capoeira: African martial art developed as resistance","Quilombo dos Palmares (1605–1694): free African republic"] },
  { id:"usa",      name:"African American Heritage",      region:"USA",                  lat:32,   lon:-82,  type:"diaspora",       startYear:1619,    era:"1619 CE",     wikiTitle:"African_Americans",   summary:"Jazz, blues, gospel, rock & roll, hip-hop — the African American cultural contribution to civilisation is incalculable.", facts:["1619: first enslaved Africans in English North America","Gullah/Geechee: preserved Mende language structures","Jazz, blues, rock & roll, hip-hop trace to African roots","Civil Rights Movement inspired freedom movements worldwide"] },
  { id:"siddi",    name:"Siddi People of India",          region:"India",                lat:14.8, lon:74.5, type:"diaspora",       startYear:700,     era:"700 CE",      wikiTitle:"Siddi",               summary:"Descendants of East Africans via Arab trade routes. Malik Ambar, born in Ethiopia, became regent who defeated Mughal Emperor Jahangir.", facts:["Arrived from East Africa via Arab trade routes, 7th century CE","Malik Ambar: regent who defeated Mughal Emperor Jahangir","Preserved East African Dammam drumming and Goma ceremonies","~70,000 Siddis remain in India today"] },
  { id:"palmares", name:"Quilombo dos Palmares",          region:"Brazil",               lat:-9,   lon:-36,  type:"diaspora",       startYear:1605,    era:"1605 CE",     wikiTitle:"Quilombo_dos_Palmares",summary:"Free African republic established by escaped enslaved people. 30,000 inhabitants at peak, surviving 90 years under Zumbi.", facts:["Free African republic surviving 90 years (1605–1694)","Population reached 30,000 at peak","Led by Zumbi dos Palmares — greatest symbol of Black resistance","Resisted 27 Portuguese and Dutch military attacks"] },
  { id:"harlem",   name:"Harlem Renaissance",             region:"New York, USA",        lat:40.8, lon:-73.9,type:"diaspora",       startYear:1920,    era:"1920 CE",     wikiTitle:"Harlem_Renaissance",  summary:"A flowering of African American art, literature, music and philosophy that redefined global culture in the 1920s–30s.", facts:["Produced Langston Hughes, Zora Neale Hurston, Duke Ellington","Directly inspired Négritude movement","Jazz and blues spread globally from Harlem in the 1920s","Laid intellectual foundations for the Civil Rights Movement"] },
  { id:"rac",      name:"Royal African Company",          region:"London, England",      lat:51.5, lon:-0.1, type:"accountability", startYear:1660,    era:"1660 CE",     wikiTitle:"Royal_African_Company",summary:"Chartered by the English Crown. Duke of York (later King James II) as governor. Transported 100,000+ enslaved Africans, branding them 'DY'.", facts:["Duke of York (King James II) was its governor","Transported 100,000+ enslaved Africans","Branded enslaved people 'DY' on their chests","Held monopoly on English slave trade 1672–1698"] },
  { id:"lloyds",   name:"Lloyd's of London",              region:"London, England",      lat:51.52,lon:-0.08,type:"accountability", startYear:1688,    era:"1688 CE",     wikiTitle:"Lloyd%27s_of_London", summary:"Insured enslaved people as cargo. The financial infrastructure that made the transatlantic trade profitable. Acknowledged this in 2020.", facts:["Insured enslaved people as property — calculated as livestock","Provided financial infrastructure that made the trade profitable","Acknowledged its role publicly in 2020","Still one of the world's largest insurance markets today"] },
  { id:"ouidah",   name:"Ouidah — Door of No Return",    region:"Benin, West Africa",   lat:6.4,  lon:2.1,  type:"accountability", startYear:1500,    era:"1500 CE",     wikiTitle:"Ouidah",              summary:"The most active slave port in West Africa. Over 1 million enslaved people passed through Ouidah's Door of No Return.", facts:["Over 1 million enslaved people departed through Ouidah","'Door of No Return' — last point of African soil","Connected to Kingdom of Dahomey","Route des Esclaves is now a UNESCO memorial trail"] },
  { id:"berlin",   name:"Berlin Conference 1884",         region:"Berlin, Germany",      lat:52.5, lon:13.4, type:"accountability", startYear:1884,    era:"1884 CE",     wikiTitle:"Scramble_for_Africa", summary:"14 European powers divided Africa with zero African representation, drawing borders that split 177 ethnic groups and created today's African nations.", facts:["14 European nations divided Africa — zero African representation","Created 54 artificial borders splitting 177 ethnic groups","Triggered colonial rule of 90% of Africa within 30 years","Colonial borders directly cause contemporary African conflicts"] },
  { id:"leopold",  name:"Belgian Congo — Leopold II",    region:"Congo",                lat:-4,   lon:24,   type:"accountability", startYear:1885,    era:"1885 CE",     wikiTitle:"Congo_Free_State",    summary:"Leopold II personally owned the Congo. He enslaved its population to extract rubber, killing an estimated 10 million Congolese — the first genocide of the 20th century.", facts:["Leopold personally owned Congo as private property","~10 million Congolese killed — first genocide of the 20th century","Hands cut off as punishment for failing rubber quotas","Inspired Joseph Conrad's Heart of Darkness (1899)"] },

  // ── WORLD CIVILIZATIONS ───────────────────────────────────
  { id:"rome",         name:"Roman Empire",                   region:"Mediterranean",         lat:41.9,  lon:12.5,  type:"world",  startYear:-500,   era:"500 BCE",  wikiTitle:"Roman_Empire",                  summary:"At its peak the Roman Empire stretched from Britain to Mesopotamia, governing 70 million people. Its law, language, and architecture shaped Western civilisation — and it was led by a North African emperor, Septimius Severus, in 193 CE.", facts:["Governed ~20% of the world's population at its peak","Roman law is the foundation of most Western legal systems","Latin evolved into French, Spanish, Italian, Portuguese, Romanian","Septimius Severus — Rome's greatest emperor — was born in North Africa"] },
  { id:"greece",       name:"Ancient Greece",                 region:"Mediterranean",         lat:37.9,  lon:23.7,  type:"world",  startYear:-800,   era:"800 BCE",  wikiTitle:"Ancient_Greece",                summary:"The birthplace of democracy, philosophy, and the Olympic Games — but Greek civilisation was deeply shaped by Egypt and Africa. Pythagoras, Plato, and Aristotle all studied in Egypt.", facts:["Democracy invented in Athens c.507 BCE","Pythagoras, Plato, Aristotle all studied in Egypt","Alexander the Great spread Greek culture from Egypt to India","The Library of Alexandria was the world's first great research institution"] },
  { id:"mesopotamia",  name:"Mesopotamia — Cradle of Civilization", region:"Iraq",          lat:33.3,  lon:44.4,  type:"world",  startYear:-3500,  era:"3500 BCE", wikiTitle:"Mesopotamia",                   summary:"The Tigris-Euphrates river valley gave humanity the world's first cities, first writing system (cuneiform), first legal code (Hammurabi), and the foundations of mathematics and astronomy.", facts:["World's first cities: Uruk, Ur, Babylon — 5,000+ years ago","Cuneiform: world's first writing system, c.3400 BCE","Hammurabi's Code (1754 BCE): 282 laws carved in stone","60-second minute, 60-minute hour, 360-degree circle — all Babylonian"] },
  { id:"persia",       name:"Persian Empire — Achaemenid",    region:"Iran",                  lat:32.4,  lon:53.7,  type:"empire", startYear:-550,   era:"550 BCE",  wikiTitle:"Achaemenid_Empire",             summary:"The Achaemenid Persian Empire was the largest empire the world had ever seen — stretching from Greece to India. Cyrus the Great's human rights cylinder is considered the world's first charter of human rights.", facts:["Largest empire to that point: 44% of the world's population","Cyrus Cylinder (539 BCE): considered world's first human rights declaration","Royal Road: 2,700km highway connecting empire in 7 days","Zoroastrianism — one of the world's oldest monotheistic religions"] },
  { id:"silk-road",    name:"The Silk Road",                  region:"Central Asia",          lat:39.9,  lon:66.8,  type:"world",  startYear:-200,   era:"200 BCE",  wikiTitle:"Silk_Road",                     summary:"The ancient network of trade routes connecting China to the Mediterranean for 1,400 years. Ideas, religions, diseases, and technologies travelled alongside silk, spices, and gold.", facts:["Connected China to Rome across 4,000 miles","Buddhism, Islam, and Christianity spread via Silk Road","Black Death (1346) likely spread via Silk Road trade routes","Connected to West African gold trade through Arab intermediaries"] },
  { id:"china",        name:"Imperial China",                 region:"East Asia",             lat:35.8,  lon:104.2, type:"world",  startYear:-2100,  era:"2100 BCE", wikiTitle:"History_of_China",              summary:"The world's longest continuous civilisation, responsible for paper, printing, gunpowder, and the compass — the four inventions that transformed the modern world.", facts:["Paper invented in China 105 CE — 1,000 years before Europe","Gunpowder, compass, and printing press: all Chinese inventions","Ming Dynasty ships reached East Africa in 1418 — 70 years before Columbus","China's economy was the world's largest until 1820"] },
  { id:"japan",        name:"Feudal Japan & Edo Period",      region:"East Asia",             lat:35.7,  lon:139.7, type:"world",  startYear:794,    era:"794 CE",   wikiTitle:"History_of_Japan",              summary:"Japan's feudal era produced samurai culture, Zen Buddhism, and extraordinary craftsmanship. The Edo period (1603–1868) was one of the world's longest periods of peace, producing haiku, kabuki, and woodblock printing.", facts:["Samurai code of Bushido shaped Japanese culture for 700 years","Edo (Tokyo) was the world's largest city by 1800: 1 million people","Japan industrialised faster than any nation in history after 1868","Hiroshima and Nagasaki: only cities ever struck by nuclear weapons"] },
  { id:"mongol",       name:"Mongol Empire",                  region:"Central Asia",          lat:47.9,  lon:106.9, type:"empire", startYear:1206,   era:"1206 CE",  wikiTitle:"Mongol_Empire",                 summary:"The Mongol Empire was the largest contiguous land empire in history, stretching from Korea to Hungary. Genghis Khan connected East and West — enabling trade, cultural exchange, and also the Black Death.", facts:["Largest contiguous land empire: 24 million km²","Destroyed Baghdad (1258 CE) — ended Islamic Golden Age","Created first international postal system (Yam network)","Mongol Pax allowed unprecedented East-West trade and exchange"] },
  { id:"islamic-golden",name:"Islamic Golden Age — Baghdad",  region:"Iraq / Middle East",    lat:33.3,  lon:44.4,  type:"islamic",startYear:750,    era:"750 CE",   wikiTitle:"Islamic_Golden_Age",            summary:"While Europe had the Dark Ages, Baghdad's House of Wisdom was the world's greatest centre of learning. Muslim scholars preserved Greek knowledge and made breakthroughs in algebra, optics, medicine, and astronomy.", facts:["House of Wisdom (Baghdad): largest library in the world, 830 CE","Al-Khwarizmi invented algebra — the word comes from his name","Ibn Sina's Canon of Medicine: used in European universities until 1650","Al-Haytham invented the scientific method 600 years before Europe"] },
  { id:"ottoman",      name:"Ottoman Empire",                 region:"Turkey / Middle East",  lat:41.0,  lon:29.0,  type:"empire", startYear:1299,   era:"1299 CE",  wikiTitle:"Ottoman_Empire",                summary:"The Ottoman Empire lasted 600 years, ruling 3 continents and preserving Greek and Roman knowledge during Europe's Dark Ages. Constantinople fell in 1453 — the event that triggered Europe's Age of Exploration.", facts:["Ruled 3 continents for 600 years (1299–1922)","Preserved Greek and Roman texts during Europe's Dark Ages","Constantinople's fall (1453) triggered Columbus's voyage west","Ottoman libraries held more books than all of Europe combined in 1400"] },
  { id:"india",        name:"Indus Valley & Mughal India",   region:"South Asia",            lat:27.2,  lon:78.0,  type:"world",  startYear:-3300,  era:"3300 BCE", wikiTitle:"Indus_Valley_Civilisation",     summary:"The Indus Valley Civilisation (3300 BCE) had advanced urban planning, sewage systems, and standardised weights — 2,000 years before Rome. The Mughal Empire produced the Taj Mahal and controlled 25% of world GDP.", facts:["Indus Valley: first planned cities with sewage systems, 3300 BCE","Mughal Empire: 25% of world GDP at its peak (1700 CE)","Zero invented in India — transformed all mathematics","British colonisation drained $45 trillion from India (1765–1938, Columbia study)"] },
  { id:"viking",       name:"Viking Age — Norse World",       region:"Scandinavia",           lat:59.9,  lon:10.7,  type:"world",  startYear:793,    era:"793 CE",   wikiTitle:"Viking_Age",                    summary:"The Vikings were not just raiders — they were the world's greatest navigators of their age, reaching North America 500 years before Columbus, trading in Baghdad, and founding the city of Dublin.", facts:["Reached North America (Vinland) c.1000 CE — 500 years before Columbus","Founded Dublin, Kyiv, Novgorod — shaped three nations","Traded in Baghdad, Byzantium, and the Arctic simultaneously","Viking women had more legal rights than most medieval European women"] },
  { id:"maya",         name:"Maya Civilization",              region:"Mesoamerica",           lat:15.5,  lon:-89.0, type:"world",  startYear:-2000,  era:"2000 BCE", wikiTitle:"Maya_civilization",             summary:"The Maya developed one of the most sophisticated writing systems, mathematical concepts including zero, and an astronomically precise calendar — all independently of Old World civilisations.", facts:["Developed zero independently of India — simultaneously","Maya Long Count calendar accurate to within 0.00007 days/year","Chichén Itzá: built to cast shadow of feathered serpent at equinox","Classic Maya collapse (900 CE) still debated — drought, war, or ecological collapse"] },
  { id:"aztec",        name:"Aztec Empire — Tenochtitlan",   region:"Mexico",                lat:19.4,  lon:-99.1, type:"world",  startYear:1300,   era:"1300 CE",  wikiTitle:"Aztec_Empire",                  summary:"The Aztec capital Tenochtitlan (modern Mexico City) had 200,000 people in 1500 — larger than any city in Europe. Destroyed by Hernán Cortés with 600 men and smallpox.", facts:["Tenochtitlan: 200,000 people — larger than London in 1500","Developed advanced astronomy, mathematics, and medicine","Destroyed by Spanish conquistadors 1519–1521","Smallpox killed ~90% of indigenous population post-conquest"] },
  { id:"inca",         name:"Inca Empire",                   region:"South America",         lat:-13.5, lon:-71.9, type:"world",  startYear:1438,   era:"1438 CE",  wikiTitle:"Inca_Empire",                   summary:"The largest empire in pre-Columbian Americas, stretching 4,300 miles along the Andes. Built 40,000 km of roads without the wheel, iron tools, or a written language.", facts:["Largest pre-Columbian empire: 12 million people","40,000 km of roads — more than the Roman road network","No writing system, no wheel, no iron — yet built Machu Picchu","Destroyed by Francisco Pizarro with 168 men and smallpox in 1532"] },
  { id:"polynesia",    name:"Polynesian Navigation",         region:"Pacific Ocean",         lat:-17.7, lon:-149.4,type:"indigenous",startYear:-1000,era:"1000 BCE", wikiTitle:"Polynesian_navigation",         summary:"Polynesian navigators crossed 10 million square miles of open ocean using only stars, waves, and birds — settling every habitable island in the Pacific, from Hawaii to New Zealand to Easter Island.", facts:["Settled every habitable Pacific island across 10 million km²","Navigated by stars, ocean swells, and bird behaviour — no instruments","Reached Hawaii (800 CE) and New Zealand (1280 CE)","Easter Island moai: 900 statues, some 80 tonnes — moved without wheels"] },
  { id:"byzantine",    name:"Byzantine Empire",              region:"Southeast Europe",      lat:41.0,  lon:28.9,  type:"empire", startYear:330,    era:"330 CE",   wikiTitle:"Byzantine_Empire",              summary:"The Eastern Roman Empire that survived for 1,000 years after Rome's fall, preserving Greek and Roman knowledge through Europe's Dark Ages and transmitting it back to the Renaissance.", facts:["Survived 1,000 years after the fall of Western Rome","Preserved and transmitted Greek and Roman scholarship to the Renaissance","Justinian Code (529 CE): Roman law that forms modern European legal systems","Final fall of Constantinople (1453) brought Greek scholars to Italy, sparking the Renaissance"] },
  { id:"russia",       name:"Russian Empire & Tsars",        region:"Eastern Europe / Asia", lat:55.8,  lon:37.6,  type:"empire", startYear:1547,   era:"1547 CE",  wikiTitle:"Russian_Empire",                summary:"The Russian Empire stretched across 11 time zones — the largest empire in history by land area. From Ivan the Terrible to Catherine the Great to the Romanovs, it shaped a quarter of the world's land surface.", facts:["Largest empire by land area: 22.8 million km²","Catherine the Great: longest-reigning female ruler of Russia (34 years)","Trans-Siberian Railway (1891–1916): longest railway on Earth at 9,289 km","Russian Revolution (1917) ended 300 years of Romanov rule"] },
  { id:"french-rev",   name:"French Revolution — Paris",     region:"France",                lat:48.9,  lon:2.3,   type:"world",  startYear:1789,   era:"1789 CE",  wikiTitle:"French_Revolution",             summary:"The storming of the Bastille (1789) began a revolution that executed a king and queen, produced Napoleon, and sent shockwaves that toppled monarchies across Europe and inspired the Haitian Revolution.", facts:["Executed King Louis XVI and Queen Marie Antoinette in 1793","40,000 people guillotined during the Terror (1793–94)","Declaration of the Rights of Man (1789) — foundation of modern human rights","Directly inspired the Haitian Revolution — the only successful slave revolt in history"] },
  { id:"usa-civil",    name:"American Civil War & Reconstruction", region:"USA",            lat:38.9,  lon:-77.0, type:"world",  startYear:1861,   era:"1861 CE",  wikiTitle:"Reconstruction_era",            summary:"The Civil War ended slavery but Reconstruction (1865–1877) was violently dismantled. The promise of 40 acres and a mule was broken. The wealth gap created then still exists today.", facts:["40 acres and a mule: promised, then revoked by President Johnson","Freedmen's Bureau: 4 million formerly enslaved people, no reparations","Black Wall Street (Tulsa, 1921): destroyed by white mob, 300 killed","Redlining (1930s): banks refused loans in Black neighbourhoods — effects last today"] },
  { id:"tulsa",        name:"Black Wall Street — Tulsa",     region:"Oklahoma, USA",         lat:36.1,  lon:-95.9, type:"world",  startYear:1906,   era:"1906 CE",  wikiTitle:"Tulsa_race_massacre",           summary:"Greenwood, Tulsa was the wealthiest Black community in America. In 1921, a white mob — aided by the Oklahoma National Guard — burned it to the ground in 18 hours, killing up to 300 people. No one was charged.", facts:["Greenwood district: 35 blocks, 600 businesses, hospitals, law firms","May 31–June 1, 1921: destroyed in 18 hours","Up to 300 Black Americans killed — largest race massacre in US history","Bodies never found, no one charged, city tried to cover it up for 75 years"] },
  { id:"native-am",    name:"Indigenous Americas",           region:"North America",         lat:44.0,  lon:-103.4,type:"indigenous",startYear:-15000,era:"15,000 BCE",wikiTitle:"Indigenous_peoples_of_the_Americas",summary:"Over 500 distinct nations inhabited the Americas before European contact. From the Haudenosaunee democracy that inspired the US Constitution to the Lakota Sioux of the Great Plains.", facts:["500+ distinct nations before European contact","Haudenosaunee (Iroquois) Confederacy inspired the US Constitution","90% of indigenous population killed by European disease and violence","570 federally recognised tribes in the US today — still fighting for sovereignty"] },
];

const MIGRATIONS = [
  // ── Human Origins & Spread ────────────────────────────────
  { id:"s-spread",    label:"Southern African Spread",       from:[3.5,36.5],   to:[-22,21],     startYear:-100000, color:"#FFD700" },
  { id:"w-spread",    label:"West African Spread",           from:[3.5,36.5],   to:[7.5,4.5],    startYear:-70000,  color:"#FFC200" },
  { id:"nile",        label:"Nile Corridor",                 from:[3.5,36.5],   to:[27,30.5],    startYear:-60000,  color:"#FFAA00" },
  { id:"oot",         label:"Out of Africa — Coastal",       from:[3.5,36.5],   to:[12.4,92.9],  startYear:-70000,  color:"#45D4D4" },
  { id:"melanesia",   label:"Into Melanesia",                from:[12.4,92.9],  to:[-6,147],     startYear:-65000,  color:"#3DB8CC" },
  { id:"americas",    label:"Into the Americas",             from:[64.0,172.0], to:[44.0,-103.4],startYear:-15000,  color:"#7EC8A0" },
  { id:"polynesia-m", label:"Polynesian Expansion",          from:[15.0,145.0], to:[-17.7,-149.4],startYear:-1000,  color:"#26A69A" },
  { id:"nz",          label:"Settlement of New Zealand",     from:[-17.7,-149.4],to:[-41.3,174.8],startYear:1200,   color:"#2196F3" },

  // ── African Civilisations & Trade ─────────────────────────
  { id:"bantu",       label:"Bantu Expansion",               from:[4,10],       to:[-20,31],     startYear:-3000,   color:"#FF8C00" },
  { id:"transsah",    label:"Trans-Saharan Trade",           from:[13.5,-8],    to:[33,3],       startYear:-1000,   color:"#FFA040" },
  { id:"indian",      label:"Indian Ocean Trade",            from:[-6.2,39.2],  to:[14.8,74.5],  startYear:700,     color:"#709AD8" },

  // ── Slave Trade Routes ─────────────────────────────────────
  { id:"s-carib",     label:"Middle Passage → Caribbean",    from:[6.4,2.1],    to:[18.5,-72.5], startYear:1503,    color:"#E03030" },
  { id:"s-braz",      label:"Middle Passage → Brazil",       from:[0,12],       to:[-12.9,-38.3],startYear:1502,    color:"#C82020" },
  { id:"s-usa",       label:"Middle Passage → N. America",   from:[7.5,4.5],    to:[32,-82],     startYear:1619,    color:"#B01010" },

  // ── Ancient Empires & Conquest ────────────────────────────
  { id:"alexander",   label:"Alexander's Conquests",         from:[37.9,23.7],  to:[27.2,78.0],  startYear:-334,    color:"#9B59B6" },
  { id:"silk",        label:"Silk Road — East to West",      from:[35.8,104.2], to:[41.9,12.5],  startYear:-200,    color:"#E6A817" },
  { id:"mongol-exp",  label:"Mongol Expansion",              from:[47.9,106.9], to:[33.3,44.4],  startYear:1206,    color:"#795548" },
  { id:"crusades",    label:"The Crusades",                  from:[48.9,2.3],   to:[31.8,35.2],  startYear:1096,    color:"#F44336" },

  // ── Age of Exploration ────────────────────────────────────
  { id:"columbus",    label:"Columbus to Americas",          from:[40.4,-3.7],  to:[18.5,-72.5], startYear:1492,    color:"#FF5722" },
  { id:"vasco",       label:"Vasco da Gama — Around Africa", from:[38.7,-9.1],  to:[10.0,76.3],  startYear:1497,    color:"#FF7043" },
  { id:"magellan",    label:"First Circumnavigation",        from:[40.4,-3.7],  to:[-13.5,-71.9],startYear:1519,    color:"#FF8A65" },

  // ── Colonial Extraction ───────────────────────────────────
  { id:"col-congo",   label:"Colonial Extraction — Congo",   from:[-4,24],      to:[50.8,4.4],   startYear:1885,    color:"#8B3030" },
  { id:"british-india",label:"British India Trade",          from:[27.2,78.0],  to:[51.5,-0.1],  startYear:1600,    color:"#6D4C41" },

  // ── Modern Movements ─────────────────────────────────────
  { id:"panafrican",  label:"Pan-African Movement",          from:[18.5,-72.5], to:[5.6,-0.2],   startYear:1920,    color:"#4CAF7D" },
  { id:"mod-europe",  label:"Modern African Diaspora",       from:[14,15],      to:[48.8,2.3],   startYear:1950,    color:"#708090" },
];

// ── TIMELINE DATA ─────────────────────────────────────────────
const TIMELINE_EVENTS = [
  // ── Prehistory & Human Origins ─────────────────────────────
  { year:-315000, era:"prehistory",  title:"Homo Sapiens Emerge",              region:"Africa",           type:"origin",       desc:"The first anatomically modern humans appear in Africa. Jebel Irhoud skulls (Morocco) and Omo remains (Ethiopia, 195,000 BCE) are our oldest fossils.",         impact:"The origin of all 8 billion humans alive today." },
  { year:-70000,  era:"outafrica",   title:"Out of Africa Migration",           region:"East Africa",       type:"origin",       desc:"A small group of Homo sapiens crosses from East Africa into Arabia. Every non-African human alive today descends from this migration of perhaps 1,000 people.", impact:"The migration that populated every continent on Earth." },
  { year:-65000,  era:"outafrica",   title:"Humans Reach Australia",            region:"Southeast Asia",    type:"origin",       desc:"Humans use primitive watercraft to cross open ocean to Melanesia and Australia — the first ocean voyage in human history, predating Columbus by 64,500 years.",   impact:"Proved human ingenuity and boldness 65,000 years before recorded history." },
  { year:-15000,  era:"outafrica",   title:"Humans Cross into Americas",        region:"North America",     type:"origin",       desc:"Humans cross from Siberia to Alaska via the Bering land bridge, beginning the settlement of the entire American continent across 10,000 years.",               impact:"The last major landmass settled — home to 500+ distinct civilisations by 1492." },
  { year:-10000,  era:"neolithic",   title:"Agricultural Revolution",           region:"Middle East",       type:"world",        desc:"Humans in the Fertile Crescent (modern Iraq/Syria/Turkey) begin farming wheat and barley, domesticating cattle and sheep. The most transformative shift in human history.", impact:"Enabled cities, writing, armies, and civilisation — and also famine, war, and inequality." },
  { year:-9000,   era:"neolithic",   title:"Göbekli Tepe Built",                region:"Turkey",            type:"world",        desc:"The world's oldest known temple complex is constructed in southeastern Turkey — 6,000 years before Stonehenge, by hunter-gatherers, not farmers.",                 impact:"Rewrote our understanding of early religion and social organisation." },
  // ── Ancient World ──────────────────────────────────────────
  { year:-3500,   era:"firstkings",  title:"Cuneiform Invented — Mesopotamia",  region:"Iraq",              type:"world",        desc:"Sumerians in Mesopotamia invent cuneiform, the world's first writing system — originally for tracking grain and cattle, evolving into literature and law.",             impact:"Writing enabled history, law, commerce, and literature — everything that followed." },
  { year:-3100,   era:"firstkings",  title:"Ancient Egypt Founded",             region:"North Africa",      type:"civilization", desc:"Narmer unifies Upper and Lower Egypt, founding one of the world's first nation-states. The civilisation they called 'Kemet' would last 3,000 years.",               impact:"3,000 years of pyramids, medicine, mathematics, and art — the longest-lasting civilisation." },
  { year:-2560,   era:"firstkings",  title:"Great Pyramid Built",               region:"Egypt",             type:"world",        desc:"The Great Pyramid of Giza is completed — the tallest structure on Earth for the next 3,800 years. Aligned to true north within 0.05 degrees.",                   impact:"A feat of engineering that engineers still cannot fully explain." },
  { year:-2300,   era:"firstkings",  title:"Indus Valley Cities",               region:"South Asia",        type:"world",        desc:"Mohenjo-daro and Harappa — cities of 40,000+ people with grid streets, indoor plumbing, and standardised weights — 2,000 years before Rome.",                   impact:"The world's first urban civilisation, forgotten for 4,000 years until excavated in 1922." },
  { year:-2100,   era:"firstkings",  title:"Xia Dynasty — China Begins",        region:"China",             type:"world",        desc:"The first recorded Chinese dynasty begins, starting one of the world's longest continuous civilisations, responsible for paper, printing, gunpowder, and the compass.", impact:"China's civilisation has run continuously for over 4,000 years." },
  { year:-1754,   era:"firstkings",  title:"Code of Hammurabi",                 region:"Babylon",           type:"world",        desc:"Babylonian King Hammurabi publishes 282 laws on a stone stele — the world's oldest complete legal code, covering commerce, property, family, and crime.",            impact:"The foundation of the concept that law should be written, public, and apply to everyone." },
  { year:-1350,   era:"firstkings",  title:"Nefertiti & Akhenaten",             region:"Egypt",             type:"civilization", desc:"Queen Nefertiti and Pharaoh Akhenaten revolutionise Egyptian religion, introducing proto-monotheism — the world's first known monotheistic revolution.",              impact:"Likely influenced the Abrahamic faiths that would shape 4 billion people today." },
  // ── Classical Age ──────────────────────────────────────────
  { year:-776,    era:"classical",   title:"First Olympic Games",               region:"Ancient Greece",    type:"world",        desc:"The first recorded Olympic Games held at Olympia in 776 BCE. Athletes from across Greece compete in running, wrestling, and chariot racing for Zeus.",             impact:"A tradition of peaceful international competition that survives 2,800 years later." },
  { year:-550,    era:"classical",   title:"Persian Empire — Cyrus the Great",  region:"Iran",              type:"world",        desc:"Cyrus the Great founds the Achaemenid Persian Empire — the largest in history to that point. The Cyrus Cylinder (539 BCE) is history's first charter of human rights.", impact:"First empire to govern multiple cultures with tolerance rather than forced assimilation." },
  { year:-507,    era:"classical",   title:"Democracy Invented — Athens",       region:"Greece",            type:"world",        desc:"Cleisthenes introduces direct democracy in Athens — the first government in which citizens vote on laws. It excluded women, slaves, and foreigners, but the idea changed everything.", impact:"The political concept that eventually spread to govern 4 billion people." },
  { year:-500,    era:"classical",   title:"Yoruba Civilisation",               region:"West Africa",       type:"civilization", desc:"Ile-Ife emerges as the spiritual and political centre of Yoruba civilisation, developing sophisticated bronze casting and a complex religious system.",               impact:"A religion that would survive the Middle Passage and thrive on 4 continents today." },
  { year:-334,    era:"classical",   title:"Alexander's Conquests Begin",       region:"Greece",            type:"world",        desc:"Alexander the Great crosses into Persia with 37,000 soldiers. By his death at 32, he had conquered an empire from Greece to India, spreading Greek culture worldwide.", impact:"Created the Hellenistic world that shaped Rome, Christianity, and Western civilisation." },
  { year:-221,    era:"classical",   title:"Qin Unifies China",                 region:"China",             type:"world",        desc:"Qin Shi Huang becomes the first Emperor of a unified China, building the Great Wall and standardising currency, weights, and writing across the empire.",          impact:"China's centralised imperial system lasted 2,100 years until 1912." },
  { year:-44,     era:"classical",   title:"Assassination of Julius Caesar",    region:"Rome",              type:"world",        desc:"Julius Caesar assassinated on the Ides of March. The killing ended the Roman Republic and triggered civil war — from which the Roman Empire emerged.",               impact:"The most consequential political assassination in Western history." },
  { year:-27,     era:"classical",   title:"Roman Empire Founded",              region:"Rome",              type:"world",        desc:"Augustus Caesar becomes the first Roman Emperor. At its peak the empire governs 70 million people — 20% of the world — from Britain to Mesopotamia.",             impact:"Roman law, Latin language, and infrastructure shaped all of Western civilisation." },
  { year:0,       era:"classical",   title:"Birth of Jesus of Nazareth",        region:"Roman Judea",       type:"world",        desc:"Jesus is born in Roman-occupied Judea. His teachings spread across the empire as Christianity, becoming the world's largest religion by 400 CE.",                    impact:"Christianity today has 2.4 billion followers — the largest religion in history." },
  { year:330,     era:"medieval",    title:"Ethiopia Adopts Christianity",      region:"Ethiopia",          type:"civilization", desc:"King Ezana of Axum adopts Christianity — making Ethiopia one of the world's first Christian nations, 60 years before the Roman Empire.",                         impact:"The Ethiopian Orthodox Church is older than European Christianity." },
  // ── Medieval Period ────────────────────────────────────────
  { year:570,     era:"medieval",    title:"Birth of Muhammad",                 region:"Arabia",            type:"world",        desc:"Muhammad is born in Mecca. His revelations, compiled as the Quran, launch Islam — which spreads from Spain to Indonesia within 100 years of his death in 632.", impact:"Islam today has 1.9 billion followers and shaped science, art, and law across three continents." },
  { year:700,     era:"medieval",    title:"Swahili Coast Trade Empire",        region:"East Africa",       type:"civilization", desc:"The Swahili Coast city-states become the world's most sophisticated Indian Ocean trading network, connecting Africa to Arabia, Persia, India, and China.",      impact:"Africa was the hub of global trade 800 years before Columbus." },
  { year:750,     era:"medieval",    title:"Islamic Golden Age — Baghdad",      region:"Iraq",              type:"world",        desc:"The House of Wisdom in Baghdad becomes the world's greatest centre of learning. Muslim scholars make breakthroughs in algebra, optics, medicine, and astronomy.", impact:"While Europe had the Dark Ages, Islamic scholars preserved Greek knowledge and advanced science." },
  { year:800,     era:"medieval",    title:"Charlemagne's European Empire",     region:"Europe",            type:"world",        desc:"Charlemagne, King of the Franks, is crowned Holy Roman Emperor — uniting much of Western Europe for the first time since Rome and creating the idea of 'Europe'.",  impact:"The foundation of France, Germany, and Western European political culture." },
  { year:900,     era:"medieval",    title:"Great Zimbabwe Built",              region:"Southern Africa",   type:"civilization", desc:"The Shona people begin construction of Great Zimbabwe — sub-Saharan Africa's largest pre-colonial stone monument, without mortar, covering 720 hectares.",     impact:"Proof that sophisticated monumental architecture existed across sub-Saharan Africa." },
  { year:1000,    era:"medieval",    title:"Vikings Reach North America",       region:"Newfoundland",      type:"world",        desc:"Leif Erikson establishes a Norse settlement at L'Anse aux Meadows, Newfoundland — 500 years before Columbus landed in the Caribbean.",                         impact:"The first confirmed European contact with the Americas, largely forgotten for centuries." },
  { year:1066,    era:"medieval",    title:"Battle of Hastings",                region:"England",           type:"world",        desc:"William the Conqueror defeats King Harold II, changing English language, culture, and governance. French becomes the language of English courts for 300 years.",  impact:"Created modern English — a fusion of Old English and Norman French." },
  { year:1215,    era:"medieval",    title:"Magna Carta Signed",                region:"England",           type:"world",        desc:"King John forced to sign the Magna Carta — the first document establishing that the king is subject to the rule of law, not above it.",                         impact:"The foundation of constitutional democracy, human rights law, and the US Bill of Rights." },
  { year:1235,    era:"empires",     title:"Mali Empire Founded",               region:"West Africa",       type:"civilization", desc:"Sundiata Keita founds the Mali Empire. Within a century it controls more than half the world's gold and salt supply, becoming the wealthiest empire on Earth.",   impact:"Mansa Musa's wealth remains the benchmark for the richest person in all of history." },
  // ── Age of Empires ────────────────────────────────────────
  { year:1206,    era:"empires",     title:"Mongol Empire — Genghis Khan",      region:"Mongolia",          type:"world",        desc:"Genghis Khan unites the Mongol tribes and begins conquests that will create the largest contiguous land empire in history — 24 million km².",                    impact:"Killed ~40 million people but also created the first international postal system and opened East-West trade." },
  { year:1300,    era:"empires",     title:"Ottoman Empire Founded",            region:"Turkey",            type:"world",        desc:"The Ottoman Empire begins its 600-year rule across three continents. At its height it governs 32 million people from Vienna to the Persian Gulf.",              impact:"The Ottoman Empire preserved Greek and Roman knowledge and shaped the modern Middle East." },
  { year:1324,    era:"empires",     title:"Mansa Musa's Pilgrimage",           region:"West Africa",       type:"civilization", desc:"Mansa Musa travels to Mecca with 60,000 people and 100 camels of gold — distributing so much wealth that he crashed Egypt's economy for a decade.",              impact:"Mansa Musa's wealth makes him the richest individual in all of recorded history." },
  { year:1347,    era:"empires",     title:"Black Death Devastates Europe",     region:"Europe & Asia",     type:"world",        desc:"The bubonic plague, spreading along the Silk Road from Central Asia, kills 30–60% of Europe's population — 25 million people in four years.",                 impact:"Ended feudalism, triggered the Renaissance, and remains history's deadliest pandemic." },
  { year:1368,    era:"empires",     title:"Ming Dynasty — Forbidden City",     region:"China",             type:"world",        desc:"The Ming Dynasty builds the Forbidden City — a 980-building palace complex — and sends treasure fleets across the Indian Ocean, reaching East Africa in 1418.", impact:"China was the world's largest economy and most advanced civilisation throughout the Ming era." },
  { year:1440,    era:"contact",     title:"Gutenberg's Printing Press",        region:"Germany",           type:"world",        desc:"Johannes Gutenberg invents movable-type printing. Within 50 years, 20 million books are printed across Europe — more than in all previous history combined.",    impact:"The internet of the 15th century — enabled the Reformation, the Scientific Revolution, and mass literacy." },
  // ── Age of Exploration & Colonialism ─────────────────────
  { year:1441,    era:"contact",     title:"First Portuguese Slave Raid",       region:"West Africa",       type:"accountability",desc:"Portuguese sailors conduct the first European slave raid on the African coast, capturing 12 Africans — the beginning of the transatlantic slave trade.",      impact:"The start of a system that would forcibly displace over 12.5 million people over 350 years." },
  { year:1453,    era:"contact",     title:"Fall of Constantinople",            region:"Turkey",            type:"world",        desc:"The Ottoman army captures Constantinople, ending the Byzantine Empire after 1,100 years. Greek scholars flee to Italy, sparking the Renaissance.",              impact:"Blocked the Silk Road trade route and forced Europeans to find sea routes — triggering Columbus." },
  { year:1492,    era:"contact",     title:"Columbus 'Discovers' Americas",     region:"Caribbean",         type:"world",        desc:"Columbus lands in the Bahamas believing he has reached Asia. Within decades, colonisation begins. 90% of indigenous Americans will die from disease and violence.", impact:"The beginning of globalisation — and the deadliest demographic catastrophe in human history." },
  { year:1502,    era:"slavetrade",  title:"First Enslaved Africans in Americas",region:"Americas",         type:"accountability",desc:"The first enslaved Africans arrive in Hispaniola. Over the next 350 years, more than 12.5 million will be transported across the Atlantic in the Middle Passage.", impact:"The beginning of the largest forced migration in human history." },
  { year:1519,    era:"slavetrade",  title:"Cortés Destroys the Aztec Empire",  region:"Mexico",            type:"world",        desc:"Hernán Cortés with 600 soldiers, indigenous allies, and smallpox destroys the Aztec Empire and its capital Tenochtitlan — a city of 200,000, larger than London.", impact:"The conquest killed 90% of Mexico's indigenous population and erased one of history's great civilisations." },
  { year:1600,    era:"slavetrade",  title:"East India Company Founded",        region:"England",           type:"accountability",desc:"England's East India Company is chartered — beginning the era of corporate colonialism that would eventually control most of the Indian subcontinent.",            impact:"The world's first multinational corporation, which ruled 200 million people at its peak." },
  { year:1619,    era:"slavetrade",  title:"First Africans in English America", region:"Virginia, USA",     type:"accountability",desc:"The first enslaved Africans arrive in English North America at Point Comfort, Virginia. Their forced labour builds the economic foundations of the United States.", impact:"The start of 400 years of African American history — building a nation that denied them citizenship." },
  { year:1688,    era:"slavetrade",  title:"Lloyd's Insures Enslaved People",   region:"London",            type:"accountability",desc:"Lloyd's of London begins insuring enslaved Africans as cargo — treating human beings as livestock and providing the financial backbone of the slave trade.",         impact:"Lloyd's only publicly acknowledged this history in 2020. The institution still exists today." },
  // ── Revolutions & Modern Era ──────────────────────────────
  { year:1687,    era:"slavetrade",  title:"Newton's Principia Mathematica",    region:"England",           type:"world",        desc:"Isaac Newton publishes laws of motion and gravity, built on the work of Islamic scholars, Indian mathematicians, and Copernicus. The Scientific Revolution peaks.", impact:"The foundation of modern physics, engineering, and space exploration." },
  { year:1776,    era:"colonial",    title:"American Declaration of Independence",region:"USA",              type:"world",        desc:"'All men are created equal' — written by Thomas Jefferson, who owned 600 enslaved people. The United States declares independence from Britain.",                  impact:"The defining contradiction of American democracy: freedom proclaimed by slaveholders." },
  { year:1789,    era:"colonial",    title:"French Revolution",                 region:"France",            type:"world",        desc:"The storming of the Bastille begins the French Revolution. Liberty, Equality, Fraternity — and the guillotine. 40,000 people executed in the Terror.",        impact:"Triggered revolutions across Europe and the Americas, including the Haitian Revolution." },
  { year:1804,    era:"colonial",    title:"Haitian Revolution Succeeds",       region:"Haiti",             type:"world",        desc:"Haiti declares independence — the world's first Black republic, created by defeating Napoleon's professional army in a 13-year war begun by enslaved people.",   impact:"The only successful slave revolt in human history. It terrified slaveholders across the Americas." },
  { year:1833,    era:"colonial",    title:"British Abolition Act",             region:"Britain",           type:"accountability",desc:"Britain abolishes slavery — but pays £20 million compensation to slave owners, not the enslaved. The British public finished paying off this loan in 2015.",   impact:"British taxpayers paid descendants of slave owners until 2015. The enslaved received nothing." },
  { year:1884,    era:"colonial",    title:"Berlin Conference — Scramble for Africa",region:"Europe",       type:"accountability",desc:"14 European powers divide Africa amongst themselves in Berlin. Zero African representatives present. They split 177 ethnic groups across arbitrary borders.",      impact:"These artificial borders created today's African nations and many of its contemporary conflicts." },
  { year:1896,    era:"colonial",    title:"Ethiopia Defeats Italy at Adwa",    region:"Ethiopia",          type:"world",        desc:"Emperor Menelik II defeats the Italian army at Adwa — the only African nation to successfully defeat a European colonial army in the Scramble for Africa.",        impact:"Adwa became a global symbol of African resistance and Black liberation." },
  { year:1905,    era:"independence",title:"Einstein's Theory of Relativity",   region:"Switzerland",       type:"world",        desc:"Albert Einstein, a 26-year-old patent clerk, publishes four papers transforming physics — including special relativity and E=mc², built on Islamic and Greek science.", impact:"Led directly to nuclear energy, GPS satellites, and modern cosmology." },
  { year:1914,    era:"independence",title:"World War I Begins",                region:"Europe",            type:"world",        desc:"The assassination of Archduke Franz Ferdinand triggers a war involving 30 nations and killing 20 million people. The map of Europe is redrawn completely.",        impact:"Ended empires, created new nations, and planted the seeds of World War II." },
  { year:1917,    era:"independence",title:"Russian Revolution",                region:"Russia",            type:"world",        desc:"The Bolshevik Revolution overthrows Tsar Nicholas II, ending 300 years of Romanov rule and creating the Soviet Union — which would last 74 years.",              impact:"Created the communist bloc that shaped the entire Cold War era and the 20th century." },
  { year:1920,    era:"independence",title:"Harlem Renaissance",                region:"New York, USA",     type:"world",        desc:"An explosion of African American art, literature, and music redefines global culture. Jazz, blues, Langston Hughes, Duke Ellington, Zora Neale Hurston.",      impact:"African Americans gave the 20th century much of its cultural soul while being denied basic rights." },
  { year:1939,    era:"independence",title:"World War II Begins",               region:"Europe",            type:"world",        desc:"Germany invades Poland on September 1, 1939. The deadliest conflict in human history — 70–85 million killed, including 6 million Jewish people in the Holocaust.", impact:"Reshaped every border on Earth and created the UN, NATO, and the modern world order." },
  { year:1945,    era:"independence",title:"Atomic Bombs — Hiroshima & Nagasaki",region:"Japan",            type:"accountability",desc:"The United States drops atomic bombs on two Japanese cities, killing 110,000–210,000 instantly. Japan surrenders. The nuclear age begins.",                     impact:"Changed warfare forever — humanity now holds the power to destroy itself." },
  { year:1947,    era:"present",     title:"Indian Independence",               region:"South Asia",        type:"world",        desc:"India and Pakistan gain independence from Britain after 200 years of colonial rule — the largest decolonisation in history, affecting 350 million people.",       impact:"The British drained an estimated $45 trillion from India during colonisation (Columbia University study)." },
  { year:1948,    era:"present",     title:"Universal Declaration of Human Rights",region:"France",         type:"world",        desc:"The UN adopts the Universal Declaration of Human Rights — 30 articles defining the rights of every human being, shaped by thinkers from 58 nations.",          impact:"The global foundation of international human rights law, still referenced in courts worldwide." },
  { year:1957,    era:"present",     title:"Ghana Independence — Year of Africa",region:"Ghana",            type:"world",        desc:"Ghana becomes the first sub-Saharan African country to gain independence, led by Kwame Nkrumah. 17 more African nations follow in 1960 alone.",              impact:"Triggered the wave of African independence that decolonised an entire continent." },
  { year:1969,    era:"present",     title:"Moon Landing",                      region:"USA / Space",       type:"world",        desc:"Neil Armstrong walks on the Moon — made possible by Katherine Johnson, Dorothy Vaughan, and Mary Jackson, three Black women whose calculations were essential.", impact:"The greatest technological achievement in human history — built on work history forgot to credit." },
  { year:1989,    era:"present",     title:"Fall of the Berlin Wall",           region:"Germany",           type:"world",        desc:"The Berlin Wall falls on November 9, ending the Cold War division of Europe. Within two years, the Soviet Union collapses and 15 new nations are born.",        impact:"Ended the Cold War era and reshaped the political map of the world overnight." },
  { year:1994,    era:"present",     title:"End of Apartheid",                  region:"South Africa",      type:"world",        desc:"Nelson Mandela becomes South Africa's first democratically elected president, ending 46 years of apartheid — the last formal racial segregation system.",    impact:"The last formal system of racial segregation in the world ends, 340 years after it began." },
  { year:2001,    era:"present",     title:"September 11 Attacks",              region:"USA",               type:"world",        desc:"Al-Qaeda hijacks four planes and kills 2,977 people in New York, Washington, and Pennsylvania — triggering wars in Afghanistan and Iraq lasting 20 years.",   impact:"Reshaped global security, civil liberties, and Islam's relationship with the West for a generation." },
  { year:2020,    era:"present",     title:"COVID-19 Pandemic",                 region:"Worldwide",         type:"world",        desc:"A coronavirus originating in Wuhan, China kills over 7 million people globally, shutting down the world economy and accelerating remote work and digital life.", impact:"The worst pandemic since 1918 — exposed deep inequalities in healthcare and governance." },
  { year:2020,    era:"present",     title:"Global Reckoning — George Floyd",   region:"Worldwide",         type:"accountability",desc:"George Floyd's murder by police triggers global Black Lives Matter protests in 60 countries. Statues of slave traders toppled. Museums face repatriation demands.", impact:"The global conversation about slavery's legacy — and who still benefits — breaks into the mainstream." },
];


// ── PEOPLE ────────────────────────────────────────────────────
const PEOPLE = [
  { id:"mansa-musa",  name:"Mansa Musa I",         dates:"c. 1280–1337",  region:"Mali, West Africa",     role:"Emperor",       wikiTitle:"Mansa_Musa",           desc:"Emperor of the Mali Empire and likely the wealthiest person in all of recorded human history. Controlled over 50% of the world's gold supply. His 1324 Mecca pilgrimage of 60,000 people so flooded markets with gold that it caused a decade of inflation across North Africa and the Middle East.", legacy:"Set the benchmark for wealth that no human since has surpassed." },
  { id:"nefertiti",   name:"Nefertiti",             dates:"c. 1370–1330 BCE",region:"Egypt, North Africa", role:"Queen/Co-Regent",wikiTitle:"Nefertiti",            desc:"Queen of Egypt and arguably its most powerful female ruler. With Akhenaten, she led a religious revolution introducing proto-monotheism. Her famous bust is one of the most reproduced artworks in history and resides in Berlin — despite Egyptian demands for its return.", legacy:"Her image has become one of the most recognised faces in human history." },
  { id:"taharqa",     name:"Taharqa",               dates:"690–664 BCE",    region:"Kush/Sudan",           role:"Pharaoh",        wikiTitle:"Taharqa",              desc:"The greatest Nubian pharaoh of the 25th Dynasty. He ruled all of Egypt and Kush, launched a renaissance in art and architecture, and is mentioned in the Bible (Isaiah 37:9). He built more temples than any pharaoh since Ramesses II.", legacy:"A Black African pharaoh who ruled the most powerful empire on Earth." },
  { id:"sundiata",    name:"Sundiata Keita",         dates:"c. 1217–1255",  region:"Mali, West Africa",    role:"Emperor",        wikiTitle:"Sundiata_Keita",       desc:"Founder of the Mali Empire. Born unable to walk, he overcame disability to defeat the Sosso king Sumanguru Kante and unite the Manden peoples. The Epic of Sundiata is West Africa's greatest oral tradition — a story comparable to Homer's Iliad.", legacy:"From disability to empire — his story is one of the greatest in human history." },
  { id:"yaa-asantewaa",name:"Yaa Asantewaa",        dates:"c. 1840–1921",  region:"Ghana, West Africa",   role:"Queen Mother/War Leader",wikiTitle:"Yaa_Asantewaa",  desc:"Queen Mother of the Ashanti who led the War of the Golden Stool (1900) against the British Empire. She famously shamed Ashanti men into fighting: 'If you the men of Ashanti will not go forward, then we will. We the women will.' She was captured and exiled but never surrendered.", legacy:"One of the last African rulers to wage war against British colonialism." },
  { id:"zumbi",       name:"Zumbi dos Palmares",    dates:"c. 1655–1695",  region:"Brazil",               role:"Resistance Leader",wikiTitle:"Zumbi",               desc:"Last leader of Quilombo dos Palmares — the free African republic in Brazil that survived 90 years. He was born free, captured into slavery, escaped, and led the republic's resistance against 27 Portuguese and Dutch military attacks. Betrayed and executed in 1695.", legacy:"Brazil's greatest symbol of Black resistance. November 20 is Black Consciousness Day in his honour." },
  { id:"malik-ambar", name:"Malik Ambar",           dates:"1548–1626",     region:"India (born Ethiopia)",role:"Regent/General",  wikiTitle:"Malik_Ambar",          desc:"Born in Ethiopia and enslaved, transported to India via Arab traders. Rose to become regent of the Ahmednagar Sultanate and organised an army of 50,000. He defeated Mughal Emperor Jahangir's forces multiple times using guerrilla warfare and died undefeated.", legacy:"An enslaved African who became a general who defeated a emperor." },
  { id:"toussaint",   name:"Toussaint Louverture",  dates:"1743–1803",     region:"Haiti",                role:"Revolutionary General",wikiTitle:"Toussaint_Louverture",desc:"Leader of the Haitian Revolution — the only successful slave revolt in history. A formerly enslaved man who defeated the armies of France, Spain and Britain. Napoleon imprisoned him in a cold French mountain fortress where he died — but his revolution succeeded without him.", legacy:"The man who made the only successful slave revolution in history." },
  { id:"nkrumah",     name:"Kwame Nkrumah",         dates:"1909–1972",     region:"Ghana",                role:"President/Philosopher",wikiTitle:"Kwame_Nkrumah",     desc:"First President of Ghana and the father of Pan-Africanism. Led Ghana to independence in 1957, the first sub-Saharan African nation to throw off colonial rule. His philosophy of African socialism and continental unity influenced independence movements across the continent.", legacy:"'Ghana is free forever!' — his words triggered the liberation of an entire continent." },
  { id:"sankara",     name:"Thomas Sankara",         dates:"1949–1987",     region:"Burkina Faso",         role:"President",      wikiTitle:"Thomas_Sankara",       desc:"President of Burkina Faso from 1983 to 1987. Renamed the country from 'Upper Volta' (a colonial name) to Burkina Faso ('Land of Upright People'). Launched mass literacy campaigns, planted 10 million trees, and vaccinated 2.5 million children in one week. Assassinated, likely with French involvement.", legacy:"'You cannot carry out fundamental change without a certain amount of madness.'" },
  { id:"wangari",     name:"Wangari Maathai",        dates:"1940–2011",     region:"Kenya",                role:"Environmentalist/Nobel Laureate",wikiTitle:"Wangari_Maathai",desc:"Founded the Green Belt Movement, planting over 51 million trees across Africa. First African woman to win the Nobel Peace Prize (2004). Jailed multiple times by the Kenyan government for her activism. Her work connected environmental restoration, democracy and women's rights.", legacy:"51 million trees. One Nobel Prize. Imprisoned multiple times for the right thing." },
  { id:"harriet",     name:"Harriet Tubman",         dates:"1822–1913",     region:"USA",                  role:"Liberator/Spy",  wikiTitle:"Harriet_Tubman",       desc:"Born enslaved, she escaped and then made 13 missions to rescue approximately 70 enslaved people via the Underground Railroad. During the Civil War she became the first woman to lead an armed raid in US history, freeing 700 enslaved people in the Combahee River Raid.", legacy:"She never lost a single passenger on the Underground Railroad." },
  { id:"fanon",       name:"Frantz Fanon",           dates:"1925–1961",     region:"Martinique/Algeria",   role:"Philosopher/Psychiatrist",wikiTitle:"Frantz_Fanon",   desc:"Psychiatrist and philosopher from Martinique who became the foremost theorist of decolonisation. His books The Wretched of the Earth and Black Skin, White Masks are foundational texts of postcolonial theory, directly influencing the Black Power movement, ANC, and independence movements worldwide.", legacy:"Provided the intellectual framework for understanding and dismantling colonialism." },
  { id:"mae-jemison", name:"Mae Jemison",            dates:"1956–present",  region:"USA",                  role:"Astronaut/Doctor/Entrepreneur",wikiTitle:"Mae_C._Jemison",desc:"First African American woman in space (1992). A medical doctor, chemical engineer, and peace corps volunteer before becoming an astronaut. After NASA she founded a company to develop technologies for the developing world and now leads the 100 Year Starship project.", legacy:"'Never be limited by other people's limited imaginations.'" },

  // ── WORLD FIGURES ──────────────────────────────────────────
  { id:"cleopatra",    name:"Cleopatra VII",          dates:"69–30 BCE",    region:"Egypt / Mediterranean", role:"Pharaoh / Diplomat",         wikiTitle:"Cleopatra",            desc:"The last active ruler of the Ptolemaic Kingdom of Egypt. Fluent in 9 languages, a skilled naval commander, the most powerful woman of the ancient world. Her alliances with Julius Caesar and Mark Antony shaped the Mediterranean.", legacy:"Held the Roman Empire at bay through diplomacy and military genius for 21 years." },
  { id:"ibn-battuta",  name:"Ibn Battuta",            dates:"1304–1368",    region:"Morocco / World",       role:"Explorer / Scholar",          wikiTitle:"Ibn_Battuta",           desc:"The greatest traveller of the pre-modern world — 75,000 miles across 44 countries over 30 years. Visited Mali, China, India, and Russia. His Rihla is a primary historical source for 14th-century civilisations across three continents.", legacy:"Documented the world at a time when no European had seen half of it." },
  { id:"marie-curie",  name:"Marie Curie",            dates:"1867–1934",    region:"Poland / France",       role:"Physicist / Chemist",         wikiTitle:"Marie_Curie",           desc:"First woman to win a Nobel Prize — then won a second in a different field. Discovered polonium and radium. Developed mobile X-ray units in WWI. Faced systematic discrimination as a woman in science her entire life.", legacy:"The only person in history to win Nobel Prizes in two different sciences." },
  { id:"gandhi",       name:"Mahatma Gandhi",         dates:"1869–1948",    region:"India",                 role:"Independence Leader",         wikiTitle:"Mahatma_Gandhi",        desc:"Led India's independence movement through non-violent civil disobedience — inspiring Martin Luther King Jr., Nelson Mandela, and every peaceful resistance movement since. Assassinated in 1948, days after Indian independence.", legacy:"Proved that non-violent resistance can defeat the most powerful empire on Earth." },
  { id:"mlk",          name:"Martin Luther King Jr.", dates:"1929–1968",    region:"USA",                   role:"Civil Rights Leader",         wikiTitle:"Martin_Luther_King_Jr.", desc:"Led the American Civil Rights Movement through non-violent protest, culminating in the Civil Rights Act (1964) and Voting Rights Act (1965). Nobel Peace Prize 1964. Assassinated April 4, 1968 in Memphis, Tennessee.", legacy:"'Injustice anywhere is a threat to justice everywhere.'" },
  { id:"newton",       name:"Isaac Newton",           dates:"1643–1727",    region:"England",               role:"Physicist / Mathematician",   wikiTitle:"Isaac_Newton",          desc:"Formulated the laws of motion and universal gravitation, invented calculus, and explained the spectrum of light — all before age 26. Built on work by Islamic scholars Al-Biruni and Ibn al-Haytham, and Indian mathematician Brahmagupta.", legacy:"The most influential scientist in history — whose work enabled every machine ever built." },
  { id:"einstein",     name:"Albert Einstein",        dates:"1879–1955",    region:"Germany / USA",         role:"Theoretical Physicist",       wikiTitle:"Albert_Einstein",       desc:"Developed special and general relativity, explained the photoelectric effect (Nobel 1921), and proved E=mc². Fled Nazi Germany in 1933. Spent his final years warning against nuclear weapons he had inadvertently helped create.", legacy:"Changed humanity's understanding of space, time, gravity and the universe itself." },
  { id:"ada-lovelace",  name:"Ada Lovelace",           dates:"1815–1852",    region:"England",               role:"Mathematician / First Programmer", wikiTitle:"Ada_Lovelace",      desc:"Daughter of Lord Byron. Worked with Charles Babbage on his Analytical Engine and wrote the first computer algorithm in 1843 — 100 years before the first digital computer was built. Called herself an 'analyst and metaphysician.'", legacy:"The world's first computer programmer. The US military's Ada language is named after her." },
  { id:"genghis-khan",  name:"Genghis Khan",           dates:"1162–1227",    region:"Mongolia",              role:"Conqueror / Emperor",         wikiTitle:"Genghis_Khan",          desc:"Founded the largest contiguous land empire in history, stretching from the Pacific to Eastern Europe. Killed an estimated 40 million people. Also created the first international postal system and promoted religious freedom across his empire.", legacy:"0.5% of all men alive today descend from him — the most reproduced human in history." },

  // ── WORLD HISTORY FIGURES ──────────────────────────────────
  { id:"caesar",         name:"Julius Caesar",          dates:"100–44 BCE",   region:"Roman Empire",          role:"General / Dictator",          wikiTitle:"Julius_Caesar",         desc:"Roman general and statesman who transformed the Republic into the Empire. Conquered Gaul, crossed the Rubicon, and was assassinated by senators who feared he would become king. His calendar reform (Julian calendar) shaped how the world measures time.", legacy:"'Et tu, Brute?' — the most famous betrayal in history. His name became the title of German Kaisers and Russian Tsars." },
  { id:"napoleon",       name:"Napoleon Bonaparte",     dates:"1769–1821",    region:"France / Europe",       role:"Emperor / General",           wikiTitle:"Napoleon",              desc:"Rose from Corsican obscurity to become Emperor of the French and conqueror of most of Europe. His Napoleonic Code reformed law across Europe and the world. Defeated at Waterloo (1815), exiled to Saint Helena, and died there.", legacy:"The Napoleonic Code remains the basis of law in France, Quebec, Louisiana, and much of Latin America." },
  { id:"suleiman",       name:"Suleiman the Magnificent",dates:"1494–1566",  region:"Ottoman Empire",        role:"Sultan / Lawgiver",           wikiTitle:"Suleiman_the_Magnificent", desc:"The longest-reigning sultan of the Ottoman Empire at its peak. Known as 'the Lawgiver' in Turkish — he codified Ottoman law, commissioned magnificent architecture including the Süleymaniye Mosque, and expanded the empire from Vienna to the Persian Gulf.", legacy:"Under Suleiman the Ottomans had more territory than the Roman Empire at its height." },
  { id:"ashoka",         name:"Ashoka the Great",       dates:"304–232 BCE",  region:"Maurya Empire, India",  role:"Emperor / Buddhist",          wikiTitle:"Ashoka",                desc:"Maurya emperor who unified most of the Indian subcontinent, then renounced violence after the bloody Kalinga War and embraced Buddhism. Spread Buddhism across Asia through missionary work and his famous rock edicts preaching non-violence, tolerance, and welfare.", legacy:"The Ashoka Chakra — his wheel — is on the flag of modern India." },
  { id:"wu-zetian",      name:"Wu Zetian",              dates:"624–705 CE",   region:"Tang Dynasty, China",   role:"Empress / Ruler",             wikiTitle:"Wu_Zetian",             desc:"The only woman in Chinese history to assume the title of Empress Regnant. She ruled China for 45 years — first as regent, then in her own name — and is credited with strengthening the Tang Dynasty, reforming the civil service, and promoting Buddhism.", legacy:"Ruled the world's most populous nation as the sole female emperor in Chinese history." },
  { id:"saladin",        name:"Saladin",                dates:"1137–1193",    region:"Egypt / Syria",         role:"Sultan / Military Leader",    wikiTitle:"Saladin",               desc:"Kurdish military leader who became Sultan of Egypt and Syria, united the Muslim world, and recaptured Jerusalem from the Crusaders in 1187. Known by both Muslim and Christian sources for his chivalry, strategic genius, and fair treatment of conquered peoples.", legacy:"Even his Crusader enemies wrote admiringly of his honour — a rare tribute in medieval warfare." },
  { id:"confucius",      name:"Confucius",              dates:"551–479 BCE",  region:"China",                 role:"Philosopher / Teacher",       wikiTitle:"Confucius",             desc:"Chinese philosopher whose teachings on ethics, family, social harmony, and governance became the foundation of East Asian thought for 2,500 years. His Analects shaped the governance of China, Japan, Korea, and Vietnam. Confucianism outlasted every dynasty.", legacy:"More people have lived under Confucian values than any other philosophical system in history." },
  { id:"bolívar",        name:"Simón Bolívar",          dates:"1783–1830",    region:"South America",         role:"Liberator",                   wikiTitle:"Simón_Bolívar",         desc:"'El Libertador' — the man who liberated six South American nations from Spanish rule: Venezuela, Colombia, Ecuador, Peru, Bolivia, and Panama. Dreamed of a united South America and nearly achieved it before political realities tore it apart.", legacy:"Bolivia is named after him. His vision of Latin American unity still drives politics today." },
  { id:"elizabeth-i",   name:"Elizabeth I",            dates:"1533–1603",    region:"England",               role:"Queen / Monarch",             wikiTitle:"Elizabeth_I",           desc:"Queen of England for 45 years — the 'Virgin Queen' who defeated the Spanish Armada, presided over a golden age of English literature (Shakespeare, Marlowe), and laid the foundations of the British Empire. Ruled alone, never married, and outmanoeuvred every male rival.", legacy:"The Elizabethan Era is considered England's cultural golden age." },
  { id:"da-vinci",       name:"Leonardo da Vinci",      dates:"1452–1519",    region:"Italy",                 role:"Artist / Scientist / Engineer",wikiTitle:"Leonardo_da_Vinci",    desc:"The Renaissance genius — painter of the Mona Lisa and Last Supper, designer of flying machines, tanks, and solar power, anatomist of the human body. His notebooks, written in mirror script, contain 13,000 pages of observations that anticipated modern science by 400 years.", legacy:"Often called 'the greatest genius who ever lived' — the original polymath." },
  { id:"lincoln",        name:"Abraham Lincoln",        dates:"1809–1865",    region:"USA",                   role:"President / Emancipator",     wikiTitle:"Abraham_Lincoln",       desc:"16th US President who led the Union through the Civil War and abolished slavery with the Emancipation Proclamation (1863). Born in a log cabin in Kentucky, he was entirely self-educated. Assassinated by John Wilkes Booth in 1865, days after the Confederacy's surrender.", legacy:"Ended the legal institution of slavery in the United States — freeing 4 million people." },
  { id:"hirohito",       name:"Hirohito — Emperor Shōwa",dates:"1901–1989",  region:"Japan",                 role:"Emperor",                     wikiTitle:"Hirohito",              desc:"Emperor of Japan during World War II and the subsequent transformation into a constitutional democracy. His reign spanned the Pacific War, nuclear bombing of Hiroshima and Nagasaki, Japan's surrender, and the extraordinary economic recovery that made Japan one of the world's largest economies.", legacy:"Reigned for 63 years — one of the longest in Japanese history — and witnessed Japan's complete transformation." },
];


// ── SECTIONS NAV ──────────────────────────────────────────────

// ── JOURNEY TRACKER ───────────────────────────────────────────
// 100% local. No accounts, no PII, no server calls.
// Stores anonymous behavioral breadcrumbs in localStorage only.

const JOURNEY_KEY = "severus_journey";
const MAX_EVENTS  = 600;

function track(type, meta = {}) {
  try {
    const raw    = localStorage.getItem(JOURNEY_KEY);
    const stored = raw ? JSON.parse(raw) : { events:[] };
    const event  = { d: new Date().toISOString().slice(0,10), type, ...meta };
    const events = [...stored.events, event].slice(-MAX_EVENTS);
    localStorage.setItem(JOURNEY_KEY, JSON.stringify({ events }));
  } catch {}
}

function getJourneyData() {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    return raw ? JSON.parse(raw) : { events:[] };
  } catch { return { events:[] }; }
}

function clearJourney() {
  try { localStorage.removeItem(JOURNEY_KEY); } catch {}
}

const SECTIONS = [
  { id:"home",        label:"Home",        icon:"home",    colorKey:"accent" },
  { id:"explore",     label:"Explore",     icon:"globe",   colorKey:"info",    tagline:"The Interactive Globe",   status:"active" },
  { id:"timeline",    label:"Timeline",    icon:"clock",   colorKey:"accent",  tagline:"315,000 BCE → Present",   status:"active" },
  { id:"learn",       label:"Learn",       icon:"book",    colorKey:"info",    tagline:"People & Civilizations",  status:"active" },
  { id:"vr",          label:"Sites",       icon:"pin",     colorKey:"success", tagline:"Historical Sites",        status:"active" },
  { id:"investigate", label:"Investigate", icon:"connect", colorKey:"slate",   tagline:"The PI Board",            status:"active" },
  { id:"research",    label:"Research",    icon:"ai",      colorKey:"success", tagline:"AI Research Suite",       status:"active" },
  { id:"journey",     label:"Journey",     icon:"flame",   colorKey:"accent",  tagline:"Your Learning Journey",   status:"active" },
];

// ── ICONS ─────────────────────────────────────────────────────
function Ic({ n, s=16, c="currentColor", sw=1.6 }) {
  const st={width:s,height:s,display:"inline-block",flexShrink:0,verticalAlign:"middle"};
  const P={
    home:   <><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z"/><path d="M9 21V13h6v8"/></>,
    globe:  <><circle cx="12" cy="12" r="9"/><path d="M12 3c-2.5 2.5-4 5.8-4 9s1.5 6.5 4 9M12 3c2.5 2.5 4 5.8 4 9s-1.5 6.5-4 9"/><path d="M3 12h18M4.5 7.5h15M4.5 16.5h15"/></>,
    clock:  <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>,
    book:   <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    scale:  <><path d="M12 3v18M3 8l4.5 9H3m13.5-9l4.5 9h-4.5"/><line x1="3" y1="17" x2="21" y2="17"/><line x1="8" y1="3" x2="16" y2="3"/></>,
    connect:<><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 7.5L11 16M17 7.5L13 16"/></>,
    ai:     <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/></>,
    moon:   <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
    sun:    <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
    chevR:  <path d="M9 18l6-6-6-6"/>,
    chevL:  <path d="M15 18l-6-6 6-6"/>,
    arrowR: <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    menu:   <><path d="M4 6h16M4 12h10M4 18h16"/></>,
    flame:  <path d="M12 2c0 6-6 8-6 13a6 6 0 0012 0c0-5-6-7-6-13z"/>,
    extlink:<><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    plus:   <><path d="M12 5v14M5 12h14"/></>,
    trash:  <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
    send:   <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    user:   <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></>,
    pin:    <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    link:   <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
    warning:<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    check:  <path d="M5 13l4 4L19 7"/>,
    vr:     <><rect x="2" y="8" width="20" height="10" rx="4"/><circle cx="8.5" cy="13" r="2"/><circle cx="15.5" cy="13" r="2"/><path d="M2 11h20"/></>,
    cube:   <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    key:    <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={st}>{P[n]}</svg>;
}

function colOf(T, key) {
  return ({accent:T.accent,info:T.info,success:T.success,slate:T.slate})[key]||T.accent;
}

function Counter({ to, suffix="", delay=0 }) {
  const [n,setN]=useState(0); const r=useRef();
  useEffect(()=>{
    const t=setTimeout(()=>{
      const s=Date.now(),dur=1800;
      const tick=()=>{const p=Math.min((Date.now()-s)/dur,1);setN(Math.floor((1-Math.pow(1-p,3))*to));if(p<1)r.current=requestAnimationFrame(tick);};
      r.current=requestAnimationFrame(tick);
    },delay);
    return()=>{clearTimeout(t);cancelAnimationFrame(r.current);};
  },[to]);
  return <>{n.toLocaleString()}{suffix}</>;
}

function PBar({ label, pct, color, T, delay=0 }) {
  const [w,setW]=useState(0);
  const lvl=pct>=80?"Expert":pct>=55?"Adept":"Journeyman";
  useEffect(()=>{const t=setTimeout(()=>setW(pct),500+delay);return()=>clearTimeout(t);},[pct,delay]);
  return (
    <div style={{marginBottom:13}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid}}>{label}</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color}}>{lvl}</span>
      </div>
      <div style={{height:3,background:T.border,borderRadius:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${w}%`,background:color,borderRadius:4,transition:"width 1.3s cubic-bezier(0.4,0,0.2,1)"}}/>
      </div>
    </div>
  );
}

function useWikiImage(title) {
  const [img,setImg]=useState(null);
  useEffect(()=>{
    if(!title){setImg(null);return;}
    setImg(null);
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
      .then(r=>r.json()).then(d=>{
        if(d.thumbnail?.source)setImg({src:d.thumbnail.source.replace(/\/\d+px-/,"/400px-"),caption:d.displaytitle||title});
      }).catch(()=>{});
  },[title]);
  return img;
}

// ── GLOBE VIEW ────────────────────────────────────────────────
function GlobeView({ visibleLocs, visibleArcs, onLocClick, selected, theme }) {
  const globeRef   = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w:800, h:600 });

  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const obs=new ResizeObserver(entries=>{
      const {width,height}=entries[0].contentRect;
      setDims({w:Math.floor(width),h:Math.floor(height)});
    });
    obs.observe(el);
    setDims({w:el.clientWidth,h:el.clientHeight});
    return()=>obs.disconnect();
  },[]);

  useEffect(()=>{
    if(selected&&globeRef.current)
      globeRef.current.pointOfView({lat:selected.lat,lng:selected.lon,altitude:1.8},1200);
  },[selected?.id]);

  const ptLabel=useCallback(d=>`
    <div style="background:rgba(20,18,16,0.95);border:1px solid ${TYPE_META[d.type]?.color||"#FF5722"}55;padding:8px 12px;border-radius:8px;font-family:sans-serif;max-width:200px;pointer-events:none;">
      <div style="font-size:9px;color:${TYPE_META[d.type]?.color||"#FF5722"};letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px;">${TYPE_META[d.type]?.label||""}</div>
      <div style="font-size:13px;color:#FCF9F7;font-weight:600;margin-bottom:2px;">${d.name}</div>
      <div style="font-size:10px;color:#8A7D74;">${d.era}</div>
    </div>`,[]);

  return (
    <div ref={containerRef} style={{position:"relative",width:"100%",height:"100%",background:"#07080E"}}>
      <Globe
        ref={globeRef} width={dims.w} height={dims.h}
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor={theme==="dark"?"#3366CC":"#5588EE"}
        atmosphereAltitude={0.15}
        globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
        pointsData={visibleLocs} pointLat="lat" pointLng="lon"
        pointColor={d=>TYPE_META[d.type]?.color||"#FF5722"}
        pointAltitude={0.02} pointRadius={0.45}
        pointLabel={ptLabel} onPointClick={onLocClick}
        arcsData={visibleArcs}
        arcStartLat={d=>d.from[0]} arcStartLng={d=>d.from[1]}
        arcEndLat={d=>d.to[0]} arcEndLng={d=>d.to[1]}
        arcColor={d=>d.color}
        arcDashLength={0.3} arcDashGap={0.15} arcDashAnimateTime={2800}
        arcStroke={0.6} arcAltitude={0.25}
      />
      <div style={{position:"absolute",top:12,left:12,display:"flex",flexDirection:"column",gap:5,pointerEvents:"none",zIndex:5}}>
        {Object.entries(TYPE_META).map(([type,meta])=>(
          <div key={type} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:meta.color,flexShrink:0}}/>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"rgba(255,255,255,0.4)"}}>{meta.label}</span>
          </div>
        ))}
        <div style={{marginTop:5,paddingTop:5,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          {[["#FFD700","Ancient Routes"],["#E03030","Conflict/Trade"],["#4CAF7D","Modern"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <div style={{width:14,borderTop:`1.5px dashed ${c}70`}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"rgba(255,255,255,0.25)"}}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      {!selected&&<div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"rgba(255,255,255,0.2)",letterSpacing:"0.1em",textTransform:"uppercase",pointerEvents:"none",whiteSpace:"nowrap",zIndex:5}}>Drag · Scroll to zoom · Click markers to explore</div>}
    </div>
  );
}

// ── DETAIL PANEL ──────────────────────────────────────────────
function DetailPanel({ loc, T, onClose }) {
  const wikiImg = useWikiImage(loc.wikiTitle);
  const img = wikiImg || (loc.thumbnail ? { src: loc.thumbnail.replace(/\/\d+px-/,"/400px-"), caption: loc.name } : null);
  const meta = TYPE_META[loc.type] || TYPE_META.world;
  return (
    <div style={{width:300,background:T.card,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
      <div style={{height:140,background:"linear-gradient(135deg,#2A1800,#0D1A18)",position:"relative",flexShrink:0,overflow:"hidden"}}>
        {img&&<><img src={img.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",filter:"brightness(0.8)"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.85),transparent 55%)"}}/>
        <div style={{position:"absolute",bottom:7,left:10,right:28,fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"rgba(252,249,247,0.4)",fontStyle:"italic"}} dangerouslySetInnerHTML={{__html:img.caption}}/></>}
        <button onClick={onClose} style={{position:"absolute",top:8,right:8,width:22,height:22,borderRadius:"50%",background:"rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.6)",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,87,34,0.8)";e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,0.6)";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}
        >✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px 16px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 9px",borderRadius:20,background:meta.color+"22",border:`1px solid ${meta.color}40`,marginBottom:8}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:meta.color}}/>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:meta.color}}>{meta.label}</span>
        </div>
        <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:700,color:T.ink,margin:"0 0 3px",lineHeight:1.2}}>{loc.name}</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight,margin:"0 0 6px"}}>{loc.region}</p>
        <div style={{display:"inline-block",padding:"2px 8px",background:T.name==="dark"?"rgba(255,255,255,0.05)":T.surface,border:`1px solid ${T.border}`,borderRadius:4,fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.slate,marginBottom:10}}>⏱ {loc.era}</div>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,lineHeight:1.75,margin:"0 0 10px"}}>{loc.summary}</p>
        {loc.facts?.length > 0 && (
          <>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:7,fontWeight:600}}>Key Facts</div>
            {loc.facts.map((f,i)=>(
              <div key={i} style={{display:"flex",gap:7,marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:meta.color,flexShrink:0,marginTop:4}}/>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.6}}>{f}</span>
              </div>
            ))}
          </>
        )}
        {loc.type === "wiki" && loc.url && (
          <div style={{marginTop:8,padding:"8px 10px",background:meta.color+"12",border:`1px solid ${meta.color}30`,borderRadius:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:14}}>🔍</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:meta.color,fontWeight:600}}>Found via live Wikipedia search</span>
          </div>
        )}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <a href={loc.url || `https://en.wikipedia.org/wiki/${loc.wikiTitle}`} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:"7px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <Ic n="extlink" s={10} c="currentColor" sw={2}/> Wikipedia
          </a>
        </div>
      </div>
    </div>
  );
}

// ── EXPLORE SECTION ───────────────────────────────────────────
function ExploreSection({ T, theme }) {
  const [selected,    setSelected]   = useState(null);
  const [filterType,  setFilterType] = useState("all");
  const [showArcs,    setShowArcs]   = useState(true);
  const [eraIdx,      setEraIdx]     = useState(ERAS.length-1);
  const [isPlaying,   setIsPlaying]  = useState(false);
  const [globeSearch, setGlobeSearch]= useState("");
  const [searchOpen,  setSearchOpen] = useState(false);
  const [wikiResults, setWikiResults]= useState([]);
  const [wikiLoading, setWikiLoading]= useState(false);
  const [tempMarkers, setTempMarkers]= useState([]); // dynamically found wiki locations
  const searchRef = useRef(null);
  const playRef   = useRef(null);
  const era = ERAS[eraIdx];

  const fmtY=y=>{if(y<=-100000)return`${(Math.abs(y)/1000).toFixed(0)}k BCE`;if(y<0)return`${Math.abs(y).toLocaleString()} BCE`;if(y>=2024)return"Present";return`${y} CE`;};
  const visLocs=useMemo(()=>LOCATIONS.filter(l=>l.startYear<=era.year&&(filterType==="all"||l.type===filterType)),[era.year,filterType]);
  // Combine mapped locations + any temp markers from live search
  const allVisLocs=useMemo(()=>[...visLocs, ...tempMarkers],[visLocs,tempMarkers]);
  const visArcs=useMemo(()=>showArcs?MIGRATIONS.filter(m=>m.startYear<=era.year):[],[era.year,showArcs]);
  const handleClick=useCallback(loc=>{
    track("explore", { label: loc.name, region: loc.region||"" });
    setSelected(s=>s?.id===loc.id?null:loc);
  },[]);

  // ── Unified local search index ──────────────────────────────
  const searchIndex = useMemo(() => {
    const regionToLatLon = (region="") => {
      const r = region.toLowerCase();
      const match = LOCATIONS.find(l =>
        r.includes(l.region.toLowerCase().split(",")[0]) ||
        l.region.toLowerCase().split(",")[0].includes(r.split(",")[0])
      );
      return match ? { lat: match.lat, lon: match.lon, loc: match } : { lat: 20, lon: 0, loc: null };
    };
    const locs = LOCATIONS.map(l => ({
      id: l.id, name: l.name, subtitle: l.region, meta: l.era,
      category: "location", icon: TYPE_META[l.type]?.label || "Location",
      color: TYPE_META[l.type]?.color || "#FF5722", lat: l.lat, lon: l.lon, directLoc: l,
    }));
    const people = PEOPLE.map(p => {
      const { lat, lon, loc } = regionToLatLon(p.region);
      return { id: p.id, name: p.name, subtitle: p.region, meta: p.dates || "",
        category: "person", icon: p.role, color: "#009AD8", lat, lon, directLoc: loc };
    });
    const events = TIMELINE_EVENTS.map((e, i) => {
      const { lat, lon, loc } = regionToLatLon(e.region);
      return { id: `ev-${i}`, name: e.title, subtitle: e.region, meta: fmtY(e.year),
        category: "event", icon: "Event", color: "#9B59B6", lat, lon, directLoc: loc };
    });
    return [...locs, ...people, ...events];
  }, []);

  const localResults = useMemo(() => {
    if (globeSearch.length < 2) return [];
    const q = globeSearch.toLowerCase();
    return searchIndex.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.icon?.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [globeSearch, searchIndex]);

  // ── Live Wikipedia geographic search ───────────────────────
  useEffect(() => {
    if (globeSearch.length < 3) { setWikiResults([]); setWikiLoading(false); return; }
    setWikiLoading(true);
    const timer = setTimeout(async () => {
      try {
        // Step 1: search Wikipedia for pages matching the query
        const resp = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(globeSearch)}&srlimit=4&format=json&origin=*`
        );
        const data = await resp.json();
        const pages = data.query?.search || [];

        // Step 2: get summary + coordinates for each result
        const summaries = await Promise.all(
          pages.slice(0, 4).map(async p => {
            try {
              const r = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(p.title.replace(/ /g,"_"))}`
              );
              return r.ok ? r.json() : null;
            } catch { return null; }
          })
        );

        const results = summaries
          .filter(s => s && s.coordinates) // only geographic articles that have lat/lon
          .map(s => ({
            id:        `wiki-${s.pageid}`,
            name:      s.title,
            subtitle:  s.description || "Wikipedia",
            lat:       s.coordinates.lat,
            lon:       s.coordinates.lon,
            summary:   s.extract?.slice(0, 500) || "",
            thumbnail: s.thumbnail?.source || "",
            url:       s.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${s.title.replace(/ /g,"_")}`,
            wikiTitle: s.title.replace(/ /g,"_"),
            category:  "wikipedia",
            color:     "#00BCD4",
          }));

        setWikiResults(results);
      } catch { setWikiResults([]); }
      finally  { setWikiLoading(false); }
    }, 600);
    return () => { clearTimeout(timer); };
  }, [globeSearch]);

  // When a Wikipedia result is selected — add a live marker to the globe
  const handleWikiSelect = (item) => {
    setGlobeSearch(""); setSearchOpen(false);
    const tempLoc = {
      id:        item.id,
      name:      item.name,
      region:    item.subtitle,
      lat:       item.lat,
      lon:       item.lon,
      type:      "wiki",
      era:       "Wikipedia",
      summary:   item.summary,
      thumbnail: item.thumbnail,
      url:       item.url,
      wikiTitle: item.wikiTitle,
      facts:     [],
      startYear: -999999,
    };
    setTempMarkers(prev => [...prev.filter(m => m.id !== tempLoc.id), tempLoc]);
    setSelected(tempLoc);
  };

  const handleLocalSelect = (item) => {
    setGlobeSearch(""); setSearchOpen(false);
    if (item.directLoc) {
      setSelected(item.directLoc);
      if (item.directLoc.startYear > era.year) setEraIdx(ERAS.length - 1);
    }
  };

  useEffect(()=>{
    if(isPlaying){playRef.current=setTimeout(()=>{if(eraIdx<ERAS.length-1)setEraIdx(i=>i+1);else setIsPlaying(false);},2200);}
    return()=>clearTimeout(playRef.current);
  },[isPlaying,eraIdx]);

  useEffect(()=>{
    const handler=(e)=>{if(searchRef.current&&!searchRef.current.contains(e.target))setSearchOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);

  const sp=(eraIdx/(ERAS.length-1))*100;
  const CATEGORY_ICONS={location:"🌍",person:"👤",event:"⚡",wikipedia:"🔍"};
  const showDropdown = searchOpen && globeSearch.length >= 2 && (localResults.length > 0 || wikiResults.length > 0 || wikiLoading);

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"7px 14px",display:"flex",alignItems:"center",gap:6,flexShrink:0,flexWrap:"wrap"}}>

        {/* Globe search with live Wikipedia fallback */}
        <div ref={searchRef} style={{position:"relative",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"5px 12px",background:T.card,border:`1px solid ${searchOpen||globeSearch?T.accent+"60":T.border}`,borderRadius:8,minWidth:260,transition:"border-color 0.15s"}}>
            <Ic n="search" s={13} c={searchOpen?T.accent:T.inkLight}/>
            <input
              value={globeSearch}
              onChange={e=>{setGlobeSearch(e.target.value);setSearchOpen(true);}}
              onFocus={()=>setSearchOpen(true)}
              placeholder="Search anywhere in world history…"
              style={{border:"none",background:"transparent",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink,width:210,caretColor:T.accent}}
            />
            {wikiLoading && <span style={{fontSize:10,color:T.inkFaint,animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>}
            {globeSearch && !wikiLoading && <span onClick={()=>{setGlobeSearch("");setSearchOpen(false);setWikiResults([]);}} style={{cursor:"pointer",color:T.inkFaint,fontSize:13,lineHeight:1}}>✕</span>}
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

          {/* Results dropdown */}
          {showDropdown && (
            <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,width:380,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",zIndex:200,overflow:"hidden",maxHeight:420,overflowY:"auto"}}>

              {/* Local results */}
              {localResults.length > 0 && (
                <>
                  <div style={{padding:"6px 12px 4px",fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,background:T.surface}}>
                    In Severus
                  </div>
                  {localResults.map((item,i) => (
                    <div key={item.id} onClick={()=>handleLocalSelect(item)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,transition:"background 0.12s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.cardHov}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:15,flexShrink:0}}>{CATEGORY_ICONS[item.category]}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>{item.subtitle} · {item.meta}</div>
                      </div>
                      <div style={{padding:"2px 7px",borderRadius:20,background:item.color+"20",border:`1px solid ${item.color}40`,fontFamily:"'DM Sans',sans-serif",fontSize:8,color:item.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap",flexShrink:0}}>{item.category}</div>
                    </div>
                  ))}
                </>
              )}

              {/* Wikipedia results */}
              {(wikiResults.length > 0 || wikiLoading) && (
                <>
                  <div style={{padding:"6px 12px 4px",fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#00BCD4",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,background:T.surface,display:"flex",alignItems:"center",gap:6}}>
                    <span>🔍</span> Found on Wikipedia {wikiLoading ? "· searching…" : `· ${wikiResults.length} geographic match${wikiResults.length!==1?"es":""}`}
                  </div>
                  {wikiLoading && (
                    <div style={{padding:"12px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight,display:"flex",alignItems:"center",gap:8}}>
                      <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> Searching Wikipedia for geographic coordinates…
                    </div>
                  )}
                  {wikiResults.map((item,i) => (
                    <div key={item.id} onClick={()=>handleWikiSelect(item)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer",borderBottom:i<wikiResults.length-1?`1px solid ${T.border}`:"none",transition:"background 0.12s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.cardHov}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {item.thumbnail
                        ? <img src={item.thumbnail} alt="" style={{width:36,height:36,objectFit:"cover",borderRadius:6,flexShrink:0}}/>
                        : <span style={{fontSize:15,flexShrink:0}}>🌍</span>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.subtitle}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
                        <div style={{padding:"2px 7px",borderRadius:20,background:"#00BCD420",border:"1px solid #00BCD440",fontFamily:"'DM Sans',sans-serif",fontSize:8,color:"#00BCD4",fontWeight:600,textTransform:"uppercase"}}>live</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint}}>{item.lat.toFixed(1)}°, {item.lon.toFixed(1)}°</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* No results at all */}
              {!wikiLoading && localResults.length === 0 && wikiResults.length === 0 && (
                <div style={{padding:"14px",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight}}>
                  No results found. Try a different spelling or broader term.
                </div>
              )}

              <div style={{padding:"5px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint,background:T.surface,borderTop:`1px solid ${T.border}`}}>
                Searches Severus data + Wikipedia geographic database
              </div>
            </div>
          )}
        </div>

        <div style={{width:1,height:16,background:T.border,margin:"0 2px"}}/>

        {/* Type filters */}
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkLight,fontWeight:600}}>Filter</span>
        {[["all","All"],["origin","Origins"],["civilization","Ancient"],["world","World"],["empire","Empires"],["islamic","Islamic"],["indigenous","Indigenous"],["diaspora","Diaspora"],["accountability","Accountability"]].map(([v,l])=>{
          const ac=v==="all"?T.accent:TYPE_META[v]?.color||T.accent,on=filterType===v;
          return <div key={v} onClick={()=>setFilterType(v)} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${on?ac+"60":T.border}`,background:on?ac+"18":"transparent",color:on?ac:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:on?600:400,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>{l}</div>;
        })}
        <div style={{width:1,height:16,background:T.border,margin:"0 2px"}}/>
        <div onClick={()=>setShowArcs(v=>!v)} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${showArcs?"rgba(76,175,125,0.5)":T.border}`,background:showArcs?"rgba(76,175,125,0.12)":"transparent",color:showArcs?"#4CAF7D":T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:9,textTransform:"uppercase",fontWeight:600,cursor:"pointer"}}>Routes {showArcs?"On":"Off"}</div>
        <div style={{flex:1}}/>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight}}>
          <span style={{color:T.accent,fontWeight:700}}>{allVisLocs.length}</span> locations
          {tempMarkers.length > 0 && <span style={{color:"#00BCD4",fontWeight:600}}> · {tempMarkers.length} live</span>}
        </span>
      </div>

      {/* ── Globe + detail panel ─────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,overflow:"hidden"}}>
          <GlobeView visibleLocs={allVisLocs} visibleArcs={visArcs} onLocClick={handleClick} selected={selected} theme={theme}/>
        </div>
        {selected&&<DetailPanel loc={selected} T={T} onClose={()=>setSelected(null)}/>}
      </div>

      {/* ── Timeline scrubber ────────────────────────────────── */}
      <div style={{background:T.surface,borderTop:`1px solid ${T.border}`,padding:"10px 18px 12px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkLight,fontWeight:600}}>Time</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.accent}}>{fmtY(era.year)}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid}}>— {era.label}</span>
          </div>
          <div style={{display:"flex",gap:5}}>
            {[{l:"Reset",fn:()=>{setEraIdx(ERAS.length-1);setIsPlaying(false);}},{l:"◀ Prev",fn:()=>{setEraIdx(i=>Math.max(0,i-1));setIsPlaying(false);},dis:eraIdx===0},{l:isPlaying?"⏸ Pause":"⏵ Play",fn:()=>setIsPlaying(p=>!p),act:true},{l:"Next ▶",fn:()=>{setEraIdx(i=>Math.min(ERAS.length-1,i+1));setIsPlaying(false);},dis:eraIdx===ERAS.length-1}].map((b,i)=>(
              <button key={i} onClick={b.fn} disabled={b.dis} style={{padding:"5px 12px",border:`1px solid ${b.act?T.accent+"60":T.border}`,borderRadius:6,background:b.act?T.accentDim:"transparent",color:b.act?T.accent:b.dis?T.inkFaint:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,cursor:b.dis?"not-allowed":"pointer",opacity:b.dis?0.4:1,letterSpacing:"0.04em"}}>{b.l}</button>
            ))}
          </div>
        </div>
        <div style={{position:"relative",height:20,display:"flex",alignItems:"center",cursor:"pointer"}} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setEraIdx(Math.round((e.clientX-r.left)/r.width*(ERAS.length-1)));setIsPlaying(false);}}>
          <div style={{position:"absolute",left:0,right:0,height:3,background:T.border,borderRadius:3}}>
            <div style={{height:"100%",width:`${sp}%`,background:T.accent,borderRadius:3,position:"relative"}}>
              <div style={{position:"absolute",right:-6,top:-4.5,width:12,height:12,borderRadius:"50%",background:T.accent,border:`2px solid ${T.bg}`,boxShadow:`0 0 8px ${T.accent}60`}}/>
            </div>
            {ERAS.map((_,i)=><div key={i} style={{position:"absolute",left:`${(i/(ERAS.length-1))*100}%`,top:-3,width:1,height:9,background:i===eraIdx?T.accent:T.border,transform:"translateX(-50%)"}}/>)}
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
          {["315k BCE","Out of Africa","First Kingdoms","Classical Age","Colonial Era","Independence","Present"].map((l,i)=>(
            <span key={i} style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:T.inkFaint}}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}



// ── TIMELINE SECTION ──────────────────────────────────────────
function TimelineSection({ T }) {
  const [filterEra,  setFilterEra]  = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [mode,       setMode]       = useState("world"); // "world" | "mine"
  const [myEvents,   setMyEvents]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("severus_my_timeline") || "[]"); } catch { return []; }
  });
  const [addOpen,    setAddOpen]    = useState(false);
  const [draft,      setDraft]      = useState({ title:"", year:"", region:"", desc:"", era:"present", impact:"" });

  const fmtY=y=>{
    const n = Number(y);
    if(isNaN(n)) return y;
    if(n<=-100000)return`${(Math.abs(n)/1000).toFixed(0)}k BCE`;
    if(n<0)return`${Math.abs(n).toLocaleString()} BCE`;
    if(n>=2024)return"Present";
    return`${n} CE`;
  };

  const eraColors={
    prehistory:"#FFD700", outafrica:"#45D4D4", neolithic:"#4CAF7D",
    firstkings:"#FF8C00", classical:"#FF5722", medieval:"#009AD8",
    empires:"#9B59B6",    contact:"#E67E22",   slavetrade:"#E03030",
    colonial:"#8B3030",   independence:"#4CAF7D", present:"#009AD8",
    custom:"#EC4899",
  };

  const REGIONS = ["all","Africa","Asia","Europe","Americas","Middle East","Pacific","Worldwide"];

  const worldFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return TIMELINE_EVENTS
      .filter(e =>
        (filterEra === "all" || e.era === filterEra) &&
        (filterRegion === "all" || e.region.toLowerCase().includes(filterRegion.toLowerCase())) &&
        (!q || e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.region.toLowerCase().includes(q))
      )
      .sort((a,b) => a.year - b.year);
  }, [filterEra, filterRegion, search]);

  const myFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return [...myEvents]
      .filter(e => !q || e.title.toLowerCase().includes(q) || (e.desc||"").toLowerCase().includes(q))
      .sort((a,b) => Number(a.year) - Number(b.year));
  }, [myEvents, search]);

  const events = mode === "world" ? worldFiltered : myFiltered;

  const saveMyEvents = (evs) => {
    setMyEvents(evs);
    try { localStorage.setItem("severus_my_timeline", JSON.stringify(evs)); } catch {}
  };

  const addEvent = () => {
    if (!draft.title.trim() || !draft.year) return;
    const ev = { ...draft, year: Number(draft.year), id: Date.now(), type:"custom" };
    saveMyEvents([...myEvents, ev]);
    setDraft({ title:"", year:"", region:"", desc:"", era:"present", impact:"" });
    setAddOpen(false);
  };

  const deleteEvent = (id) => saveMyEvents(myEvents.filter(e => e.id !== id));

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>

      {/* ── Mode tabs + search ──────────────────────────────── */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        {[["world","🌍 World History"],["mine","📌 My Timeline"]].map(([v,l])=>(
          <button key={v} onClick={()=>{setMode(v);setSelected(null);}}
            style={{padding:"12px 4px",background:"transparent",border:"none",borderBottom:mode===v?`2px solid ${T.accent}`:"2px solid transparent",color:mode===v?T.accent:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:mode===v?600:400,cursor:"pointer",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>
            {l}
          </button>
        ))}
        <div style={{flex:1}}/>
        {mode==="mine" && (
          <button onClick={()=>setAddOpen(v=>!v)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:addOpen?T.accent:T.accentDim,border:`1px solid ${T.accent}50`,borderRadius:8,color:addOpen?"#fff":T.accent,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>
            <Ic n="plus" s={13} c="currentColor"/> Add Event
          </button>
        )}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,minWidth:200}}>
          <Ic n="search" s={13} c={T.inkLight}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={mode==="world" ? "Search events, regions…" : "Search your events…"}
            style={{border:"none",background:"transparent",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,flex:1,caretColor:T.accent}}/>
          {search&&<span onClick={()=>setSearch("")} style={{cursor:"pointer",color:T.inkFaint,fontSize:12}}>✕</span>}
        </div>
      </div>

      {/* ── Era + region filters (world mode only) ───────────── */}
      {mode==="world" && (
        <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"6px 16px",display:"flex",gap:5,alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
          {[["all","All Eras"],...ERAS.map(e=>[e.id,e.label])].map(([v,l])=>{
            const on=filterEra===v;
            const col=eraColors[v]||T.accent;
            return <div key={v} onClick={()=>setFilterEra(v)} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${on?col+"60":T.border}`,background:on?col+"18":"transparent",color:on?col:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:9,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:on?600:400,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>{l}</div>;
          })}
          <div style={{width:1,height:14,background:T.border,margin:"0 4px"}}/>
          {REGIONS.map(r=>{
            const on=filterRegion===r;
            return <div key={r} onClick={()=>setFilterRegion(r)} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${on?T.info+"60":T.border}`,background:on?T.info+"18":"transparent",color:on?T.info:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:9,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:on?600:400,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>{r}</div>;
          })}
          <div style={{flex:1}}/>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,flexShrink:0}}>
            <span style={{color:T.accent,fontWeight:700}}>{events.length}</span> events
          </span>
        </div>
      )}

      {/* ── Add event form (my timeline) ─────────────────────── */}
      {mode==="mine" && addOpen && (
        <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"14px 20px",flexShrink:0}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 120px 1fr",gap:10,marginBottom:10}}>
            <input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}
              placeholder="Event title *"
              style={{padding:"8px 10px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,outline:"none"}}/>
            <input value={draft.year} onChange={e=>setDraft(d=>({...d,year:e.target.value}))}
              placeholder="Year (e.g. -44)"
              style={{padding:"8px 10px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,outline:"none"}}/>
            <input value={draft.region} onChange={e=>setDraft(d=>({...d,region:e.target.value}))}
              placeholder="Region / Country"
              style={{padding:"8px 10px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,outline:"none"}}/>
          </div>
          <textarea value={draft.desc} onChange={e=>setDraft(d=>({...d,desc:e.target.value}))}
            placeholder="What happened? (description)"
            rows={2}
            style={{width:"100%",padding:"8px 10px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,resize:"none",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
          <div style={{display:"flex",gap:8}}>
            <input value={draft.impact} onChange={e=>setDraft(d=>({...d,impact:e.target.value}))}
              placeholder="Historical impact / why it matters"
              style={{flex:1,padding:"8px 10px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,outline:"none"}}/>
            <button onClick={addEvent} disabled={!draft.title.trim()||!draft.year}
              style={{padding:"8px 20px",background:draft.title.trim()&&draft.year?T.accent:T.border,border:"none",borderRadius:7,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:draft.title.trim()&&draft.year?"pointer":"not-allowed"}}>
              Add
            </button>
            <button onClick={()=>setAddOpen(false)}
              style={{padding:"8px 14px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* ── Event list ──────────────────────────────────────── */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

          {/* Empty states */}
          {mode==="mine" && myEvents.length===0 && !addOpen && (
            <div style={{textAlign:"center",padding:"60px 20px",color:T.inkLight}}>
              <div style={{fontSize:36,marginBottom:12}}>📌</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:T.ink,marginBottom:8}}>Your personal timeline is empty</div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,maxWidth:320,margin:"0 auto 16px",lineHeight:1.7}}>
                Add events from your own research, coursework, or family history. Build a timeline that's entirely yours.
              </p>
              <button onClick={()=>setAddOpen(true)}
                style={{padding:"9px 20px",background:T.accent,border:"none",borderRadius:8,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Add your first event
              </button>
            </div>
          )}

          {mode==="world" && events.length===0 && (
            <div style={{textAlign:"center",padding:"60px 0",color:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
              No events match your filters
            </div>
          )}

          {/* Timeline */}
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",left:16,top:0,bottom:0,width:2,background:T.border}}/>
            {events.map((ev,i) => {
              const col = eraColors[ev.era] || eraColors.custom;
              const isSel = selected?.title===ev.title && selected?.year===ev.year;
              const id = ev.id || `${ev.year}-${i}`;
              return (
                <div key={id} style={{position:"relative",paddingLeft:44,marginBottom:18,cursor:"pointer"}}
                  onClick={()=>{
                    if(!isSel) track("timeline", { label: ev.title, era: ev.era||"", region: ev.region||"" });
                    setSelected(isSel?null:ev);
                  }}>
                  <div style={{position:"absolute",left:8,top:6,width:18,height:18,borderRadius:"50%",background:isSel?col:T.card,border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",boxShadow:isSel?`0 0 12px ${col}70`:"none"}}>
                    {isSel&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
                  </div>
                  <div style={{background:isSel?T.cardHov:T.card,border:`1px solid ${isSel?col+"60":T.border}`,borderRadius:10,padding:"13px 16px",transition:"all 0.2s",boxShadow:isSel?`0 4px 16px rgba(0,0,0,0.15)`:"none"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:5}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,color:col}}>{fmtY(ev.year)}</span>
                          {ev.region && (
                            <div style={{padding:"1px 7px",borderRadius:20,background:col+"20",border:`1px solid ${col}35`}}>
                              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:col,textTransform:"uppercase",letterSpacing:"0.07em"}}>{ev.region}</span>
                            </div>
                          )}
                          {ev.type==="custom" && (
                            <div style={{padding:"1px 7px",borderRadius:20,background:"#EC489920",border:"1px solid #EC489940"}}>
                              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:"#EC4899",textTransform:"uppercase",letterSpacing:"0.07em"}}>My Event</span>
                            </div>
                          )}
                        </div>
                        <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:700,color:T.ink,margin:0,lineHeight:1.25}}>{ev.title}</h3>
                      </div>
                      {mode==="mine" && ev.type==="custom" && (
                        <button onClick={e=>{e.stopPropagation();deleteEvent(ev.id);}}
                          style={{background:"transparent",border:"none",cursor:"pointer",color:T.inkFaint,fontSize:14,padding:2,lineHeight:1,flexShrink:0}}>✕</button>
                      )}
                    </div>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.7,margin:0}}>{ev.desc}</p>
                    {isSel && ev.impact && (
                      <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:5,fontWeight:600}}>Historical Impact</div>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:col,lineHeight:1.7,margin:0,fontStyle:"italic"}}>{ev.impact}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Era sidebar (world mode) ─────────────────────────── */}
        {mode==="world" && (
          <div style={{width:188,borderLeft:`1px solid ${T.border}`,overflowY:"auto",background:T.surface,flexShrink:0}}>
            <div style={{padding:"14px 14px 8px",fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600}}>Eras</div>
            {[{id:"all",label:"All Eras"},...ERAS].map(era=>{
              const on=filterEra===era.id;
              const col=eraColors[era.id]||T.accent;
              const count = era.id==="all" ? TIMELINE_EVENTS.length : TIMELINE_EVENTS.filter(e=>e.era===era.id).length;
              return (
                <div key={era.id} onClick={()=>setFilterEra(on&&era.id!=="all"?"all":era.id)}
                  style={{padding:"9px 14px",cursor:"pointer",background:on?col+"18":"transparent",borderLeft:on?`3px solid ${col}`:"3px solid transparent",transition:"all 0.15s"}}
                  onMouseEnter={e=>{if(!on)e.currentTarget.style.background=T.card;}}
                  onMouseLeave={e=>{if(!on)e.currentTarget.style.background="transparent";}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:on?600:400,color:on?col:T.inkMid}}>{era.label}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkLight,marginTop:1}}>{count} events</div>
                </div>
              );
            })}

            {/* My timeline mini stats */}
            <div style={{padding:"14px 14px 8px",marginTop:8,borderTop:`1px solid ${T.border}`,fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600}}>My Timeline</div>
            <div style={{padding:"9px 14px",cursor:"pointer"}} onClick={()=>{setMode("mine");setSelected(null);}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid}}>Personal events</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#EC4899",marginTop:1,fontWeight:600}}>{myEvents.length} saved</div>
            </div>
          </div>
        )}

        {/* ── My timeline sidebar ──────────────────────────────── */}
        {mode==="mine" && myEvents.length>0 && (
          <div style={{width:188,borderLeft:`1px solid ${T.border}`,background:T.surface,flexShrink:0,padding:"14px"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:10,fontWeight:600}}>Your Timeline</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,fontWeight:700,marginBottom:4}}>{myEvents.length} event{myEvents.length!==1?"s":""}</div>
            {myEvents.length>0 && (
              <>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,marginBottom:12,lineHeight:1.5}}>
                  Spanning {fmtY(Math.min(...myEvents.map(e=>Number(e.year))))} → {fmtY(Math.max(...myEvents.map(e=>Number(e.year))))}
                </div>
                <button onClick={()=>{if(window.confirm("Clear your entire personal timeline?"))saveMyEvents([]);}}
                  style={{width:"100%",padding:"6px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.danger,fontFamily:"'DM Sans',sans-serif",fontSize:10,cursor:"pointer"}}>
                  Clear all events
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── LEARN SECTION ─────────────────────────────────────────────
function LearnSection({ T }) {
  const [tab,          setTab]         = useState("people");
  const [search,       setSearch]      = useState("");
  const [sel,          setSel]         = useState(null);
  const [regionFilter, setRegionFilter]= useState("all");
  const [wikiResults,  setWikiResults] = useState([]);
  const [wikiLoading,  setWikiLoading] = useState(false);
  const [wikiSel,      setWikiSel]     = useState(null); // selected wiki result shown in detail panel

  const CIVI_TYPES = new Set(["civilization","world","empire","islamic","origin"]);

  const REGION_GROUPS = [
    ["all","All"],["Africa","Africa"],["Asia","Asia"],
    ["Europe","Europe"],["Americas","Americas"],["Middle East","Middle East"],["Pacific","Pacific"],
  ];

  const filtered = useMemo(() => {
    if (tab === "contributions") return [];
    const src = tab === "people"
      ? PEOPLE
      : LOCATIONS.filter(l => CIVI_TYPES.has(l.type));
    return src.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (item.name||"").toLowerCase().includes(q) ||
        (item.role||item.era||"").toLowerCase().includes(q) ||
        (item.region||"").toLowerCase().includes(q) ||
        (item.desc||item.summary||"").toLowerCase().includes(q);
      const matchRegion = regionFilter === "all" ||
        (item.region||"").toLowerCase().includes(regionFilter.toLowerCase());
      return matchSearch && matchRegion;
    });
  }, [tab, search, regionFilter]);

  // Live Wikipedia search — fires when local results are empty and query >= 3 chars
  useEffect(() => {
    if (tab === "contributions" || search.length < 3 || filtered.length > 0) {
      setWikiResults([]); setWikiLoading(false); return;
    }
    setWikiLoading(true);
    const timer = setTimeout(async () => {
      try {
        const category = tab === "people" ? "person biography" : "civilization history empire";
        const resp = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(search + " " + category)}&srlimit=6&format=json&origin=*`
        );
        const data = await resp.json();
        const pages = data.query?.search || [];
        const summaries = await Promise.all(
          pages.slice(0, 6).map(async p => {
            try {
              const r = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(p.title.replace(/ /g,"_"))}`
              );
              return r.ok ? r.json() : null;
            } catch { return null; }
          })
        );
        setWikiResults(summaries.filter(Boolean).map(s => ({
          id:        `wiki-${s.pageid}`,
          name:      s.title,
          region:    s.description || "Wikipedia",
          desc:      s.extract?.slice(0, 300) || "",
          summary:   s.extract?.slice(0, 300) || "",
          thumbnail: s.thumbnail?.source || "",
          wikiTitle: s.title.replace(/ /g, "_"),
          url:       s.content_urls?.desktop?.page || "",
          type:      "wiki",
          role:      s.description || "",
          dates:     "",
        })));
      } catch { setWikiResults([]); }
      finally  { setWikiLoading(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, tab, filtered.length]);

  const displayItems = filtered.length > 0 ? filtered : wikiResults;
  const showingWiki  = filtered.length === 0 && wikiResults.length > 0;
  const activeSel    = sel || wikiSel;

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>

      {/* ── Header: tabs + search ─────────────────────────────── */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        {[["people","People & Figures"],["civilizations","Civilizations & Empires"],["contributions","Contributions"]].map(([v,l])=>(
          <button key={v} onClick={()=>{setTab(v);setSel(null);setWikiSel(null);setSearch("");setRegionFilter("all");setWikiResults([]);}}
            style={{padding:"12px 4px",background:"transparent",border:"none",borderBottom:tab===v?`2px solid ${T.accent}`:"2px solid transparent",color:tab===v?T.accent:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:tab===v?600:400,cursor:"pointer",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>{l}</button>
        ))}
        <div style={{flex:1}}/>
        {tab !== "contributions" && (
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:T.card,border:`1px solid ${search?T.accent+"50":T.border}`,borderRadius:8,minWidth:220,transition:"border-color 0.15s"}}>
            <Ic n="search" s={13} c={search?T.accent:T.inkLight}/>
            <input
              value={search} onChange={e=>{setSearch(e.target.value);setSel(null);setWikiSel(null);}}
              placeholder={`Search ${tab === "people" ? "people, roles, regions" : "civilizations, empires, regions"}… or anything on Wikipedia`}
              style={{border:"none",background:"transparent",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink,flex:1,caretColor:T.accent}}
            />
            {wikiLoading && <span style={{fontSize:11,color:T.inkFaint,animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>}
            {search && !wikiLoading && <span onClick={()=>{setSearch("");setWikiResults([]);}} style={{cursor:"pointer",color:T.inkFaint,fontSize:12}}>✕</span>}
          </div>
        )}
      </div>

      {/* ── Region filter + status bar ───────────────────────── */}
      {tab !== "contributions" && (
        <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"6px 16px",display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          {REGION_GROUPS.map(([v,l]) => {
            const on = regionFilter === v;
            return (
              <div key={v} onClick={()=>setRegionFilter(v)}
                style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${on?T.accent+"60":T.border}`,background:on?T.accentDim:"transparent",color:on?T.accent:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:10,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>
                {l}
              </div>
            );
          })}
          <div style={{flex:1}}/>
          {showingWiki && (
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"2px 8px",borderRadius:20,background:"#00BCD420",border:"1px solid #00BCD440"}}>
              <span style={{fontSize:10}}>🔍</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#00BCD4",fontWeight:600}}>
                {wikiResults.length} Wikipedia results for "{search}"
              </span>
            </div>
          )}
          {!showingWiki && (
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>
              <span style={{color:T.accent,fontWeight:700}}>{filtered.length}</span> results
            </span>
          )}
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {tab === "contributions"
          ? <ContributionsTab T={T} search={search} setSearch={setSearch}/>
          : <>
              <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

                {/* Loading state */}
                {wikiLoading && filtered.length === 0 && (
                  <div style={{textAlign:"center",padding:"40px 0",color:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
                    <span style={{fontSize:24,animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>
                    Searching Wikipedia for "{search}"…
                  </div>
                )}

                {/* No results at all */}
                {!wikiLoading && search.length >= 3 && displayItems.length === 0 && (
                  <div style={{textAlign:"center",padding:"60px 0",color:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
                    Nothing found for "{search}" — try a different spelling or broader term
                  </div>
                )}

                {/* Section header when showing wiki results */}
                {showingWiki && (
                  <div style={{marginBottom:16,padding:"10px 14px",background:"#00BCD412",border:"1px solid #00BCD430",borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>🔍</span>
                    <div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#00BCD4"}}>Results from Wikipedia</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>Not in Severus yet — found live from Wikipedia. Click to read more.</div>
                    </div>
                  </div>
                )}

                {/* Card grid */}
                {displayItems.length > 0 && (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
                    {displayItems.map(item => (
                      <PersonCard key={item.id} item={item} tab={tab} T={T}
                        selected={activeSel?.id === item.id}
                        onClick={()=>{
                          if (item.type === "wiki") {
                            setWikiSel(s => s?.id === item.id ? null : item);
                            setSel(null);
                          } else {
                            setSel(s => s?.id === item.id ? null : item);
                            setWikiSel(null);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Detail panel */}
              {activeSel && (
                <LearnDetailPanel item={activeSel} tab={tab} T={T} onClose={()=>{setSel(null);setWikiSel(null);}}/>
              )}
            </>
        }
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PersonCard({ item, tab, T, selected, onClick }) {
  const img   = useWikiImage(item.wikiTitle);
  const color = tab==="people" ? T.info : T.accent;
  const handleClick = () => {
    track("learn", {
      label:  item.name,
      region: item.region || "",
      subtype: tab === "people" ? "person" : "civilization",
    });
    onClick();
  };
  return (
    <div onClick={handleClick} style={{background:selected?T.cardHov:T.card,border:`1px solid ${selected?color+"50":T.border}`,borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",transform:selected?"translateY(-2px)":"none",boxShadow:selected?`0 6px 20px rgba(0,0,0,0.15)`:"none"}}>
      <div style={{height:140,background:"linear-gradient(135deg,#1A1400,#0D1814)",overflow:"hidden",position:"relative"}}>
        {img&&<img src={img.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",filter:"brightness(0.85)"}}/>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7),transparent 60%)"}}/>
        <div style={{position:"absolute",bottom:8,left:10,right:10}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:color,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{item.role||item.era||""}</div>
        </div>
      </div>
      <div style={{padding:"12px 14px"}}>
        <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:700,color:T.ink,margin:"0 0 3px",lineHeight:1.2}}>{item.name}</h3>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,margin:"0 0 6px"}}>{item.dates||item.region||""}</p>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.6,margin:0}}>{(item.desc||item.summary||"").slice(0,90)}…</p>
      </div>
    </div>
  );
}

function LearnDetailPanel({ item, tab, T, onClose }) {
  const img = useWikiImage(item.wikiTitle);
  const color = tab==="people" ? T.info : T.accent;
  return (
    <div style={{width:320,background:T.card,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
      <div style={{height:160,background:"linear-gradient(135deg,#1A1400,#0D1814)",position:"relative",flexShrink:0,overflow:"hidden"}}>
        {img&&<><img src={img.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",filter:"brightness(0.8)"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.8),transparent 55%)"}}/></>}
        <button onClick={onClose} style={{position:"absolute",top:8,right:8,width:22,height:22,borderRadius:"50%",background:"rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.6)",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 9px",borderRadius:20,background:color+"22",border:`1px solid ${color}40`,marginBottom:8}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color}}>{item.role||item.type||""}</span>
        </div>
        <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:T.ink,margin:"0 0 3px"}}>{item.name}</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight,margin:"0 0 10px"}}>{item.dates||item.region}</p>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,lineHeight:1.75,margin:"0 0 12px"}}>{item.desc||item.summary}</p>
        {item.legacy&&<div style={{padding:"10px 12px",background:color+"12",border:`1px solid ${color}30`,borderRadius:8,marginBottom:12}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color,marginBottom:4,fontWeight:600}}>Legacy</div>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,lineHeight:1.65,margin:0,fontStyle:"italic"}}>{item.legacy}</p>
        </div>}
        {item.facts&&item.facts.map((f,i)=>(
          <div key={i} style={{display:"flex",gap:7,marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:color,flexShrink:0,marginTop:4}}/>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.6}}>{f}</span>
          </div>
        ))}
        <a href={`https://en.wikipedia.org/wiki/${item.wikiTitle}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight,textDecoration:"none"}}><Ic n="extlink" s={11} c="currentColor" sw={2}/> Wikipedia</a>
      </div>
    </div>
  );
}

function ContributionsTab({ T, search="", setSearch }) {
  const contribs = [
    { cat:"Mathematics", icon:"📐", items:["Egyptian Rhind Papyrus (1550 BCE): world's earliest algebra and geometry","Indian mathematicians invented zero — transforming all of mathematics","Islamic scholars (Al-Khwarizmi, 820 CE) invented algebra — the word comes from Arabic","Greek geometry + Indian numbers + Arab algebra = modern mathematics"] },
    { cat:"Medicine", icon:"🏥", items:["Ebers Papyrus (1550 BCE): 700 medical treatments — world's oldest medical text","Edwin Smith Papyrus: first surgical text — described brain, spinal cord, nervous system","Imhotep (2650 BCE): first named physician in history — later deified","Ancient Nubians: tetracycline found in bones, suggesting antibiotic brewing"] },
    { cat:"Music & Culture", icon:"🎵", items:["Jazz, Blues, Rock & Roll, Hip-Hop — all trace to West African musical traditions","Classical music: Bach, Mozart, Beethoven built on Arabic musical theory","The Silk Road carried musical instruments from China to Persia to Europe","Every music tradition on Earth connects back to African rhythmic foundations"] },
    { cat:"Architecture", icon:"🏛️", items:["The Great Pyramid (2560 BCE): tallest structure on Earth for 3,800 years","Nubian pyramids: 200+ still standing at Meroë, Sudan","Great Zimbabwe: unmortared stone structures covering 720 hectares","Timbuktu mosques: Djinguereber Mosque built 1327 CE, still standing"] },
    { cat:"Language & Writing", icon:"📜", items:["Hieroglyphs (3200 BCE) and Sumerian cuneiform: the world's first writing systems","Phoenician alphabet → Greek alphabet → Latin alphabet → every European language","Chinese writing: 3,500 years of continuous use — the world's longest literary tradition","Arabic: language of science, medicine, and philosophy during Europe's Dark Ages"] },
    { cat:"Philosophy & Religion", icon:"🌟", items:["Egyptian Ma'at concept of justice predates Greek philosophy by 2,000 years","Buddhism, Christianity, and Islam all originated in Asia and the Middle East","The Axial Age (800–200 BCE): Confucius, Buddha, Socrates, Isaiah — all at once","Islamic Golden Age (700–1200 CE): preserved Greek philosophy and advanced science while Europe had the Dark Ages"] },
    { cat:"Science & Innovation", icon:"🔬", items:["Gunpowder, compass, paper, printing press: all invented in China","Islamic scholars invented algebra, optics, and made the first accurate maps","Coffee discovered in Ethiopia — the drink that fuelled the Enlightenment and Industrial Revolution","The Scientific Revolution (1543–1687): Copernicus, Galileo, Newton — built on Islamic and Greek foundations"] },
    { cat:"Politics & Law", icon:"⚖️", items:["Magna Carta (1215): first document establishing rule of law — foundation of all democracies","Haudenosaunee (Iroquois) Confederacy inspired the US Constitution's federal structure","Athenian democracy (507 BCE): first government by the people — though only free men counted","The UN Declaration of Human Rights (1948): shaped by thinkers from 58 nations, not just the West"] },
  ];
  const q = search.toLowerCase();
  const filtered = q
    ? contribs.map(c => ({
        ...c,
        items: c.items.filter(item => item.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q))
      })).filter(c => c.items.length > 0)
    : contribs;

  return (
    <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
      {q && filtered.length === 0 && (
        <div style={{textAlign:"center",padding:"60px 0",color:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
          Nothing found for "{search}" in contributions
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
        {filtered.map((c,i)=>(
          <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <span style={{fontSize:20}}>{c.icon}</span>
              <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:700,color:T.ink,margin:0}}>{c.cat}</h3>
            </div>
            {c.items.map((item,j)=>(
              <div key={j} style={{display:"flex",gap:8,marginBottom:7,paddingBottom:7,borderBottom:j<c.items.length-1?`1px solid ${T.border}`:"none"}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:T.accent,flexShrink:0,marginTop:4}}/>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,lineHeight:1.65}}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


// ── NODE INFO PANEL ───────────────────────────────────────────
// Shows Wikipedia image + summary + AI context when a node is selected.

function NodeInfoPanel({ node, nodes, edges, T }) {
  const [wikiImg,   setWikiImg]   = useState(null);
  const [wikiSum,   setWikiSum]   = useState("");
  const [wikiLoading, setWikiLoading] = useState(false);
  const [aiContext, setAiContext]  = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const meta = NODE_TYPES[node.type] || NODE_TYPES.person;

  // ── Wikipedia fetch ──────────────────────────────────────────
  useEffect(() => {
    setWikiImg(null); setWikiSum(""); setAiContext(null);
    setWikiLoading(true);
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(node.label.replace(/ /g,"_"))}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.thumbnail?.source) setWikiImg(d.thumbnail.source.replace(/\/\d+px-/,"/360px-"));
        if (d?.extract)           setWikiSum(d.extract.slice(0, 340));
      })
      .catch(() => {})
      .finally(() => setWikiLoading(false));
  }, [node.id]);

  // ── AI context fetch ─────────────────────────────────────────
  useEffect(() => {
    const nodeEdges = edges.filter(e => e.from === node.id || e.to === node.id);
    if (nodeEdges.length === 0) return;
    setAiContext(null);
    setAiLoading(true);

    const storedKey = getStoredKey();
    if (!storedKey) {
      setAiContext("NO_KEY");
      setAiLoading(false);
      return;
    }

    const connectionLines = nodeEdges.map(edge => {
      const otherId = edge.from === node.id ? edge.to : edge.from;
      const other   = nodes.find(n => n.id === otherId);
      const dir     = edge.from === node.id ? "connects TO" : "connected FROM";
      return other ? `• ${node.label} ${dir} "${other.label}" (${edge.label})` : null;
    }).filter(Boolean).join("\n");

    const allLabels = nodes.map(n => n.label).join(", ");

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": storedKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content:
          `You are an expert world historian on the Severus History platform.

A researcher clicked on "${node.label}" (type: ${node.type}) on their investigation board.

All nodes on this board: ${allLabels}

This node's connections:
${connectionLines}

Reply with EXACTLY these 3 sections (under 180 words total):

BACKGROUND
2 sentences: what is ${node.label} historically?

ROLE IN INVESTIGATION
2 sentences: why does this node appear here? What does it connect?

KEY INSIGHT
One sharp sentence: the most surprising or important thing about this node.`
        }],
      }),
    })
      .then(r => r.json())
      .then(d => { const t = d.content?.[0]?.text; if (t) setAiContext(t); })
      .catch(() => {})
      .finally(() => setAiLoading(false));
  }, [node.id, edges.length]);

  // Parse sections
  const sections = (() => {
    if (!aiContext) return null;
    const bg      = aiContext.match(/BACKGROUND\s*\n([\s\S]*?)(?=\n\s*ROLE IN|$)/i)?.[1]?.trim();
    const role    = aiContext.match(/ROLE IN INVESTIGATION\s*\n([\s\S]*?)(?=\n\s*KEY INSIGHT|$)/i)?.[1]?.trim();
    const insight = aiContext.match(/KEY INSIGHT\s*\n([\s\S]*?)$/i)?.[1]?.trim();
    return { bg, role, insight };
  })();

  const Shimmer = () => (
    <div style={{height:12,borderRadius:4,marginBottom:6,
      background: T.name==="dark"?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",
      animation:"shimmer 1.4s ease-in-out infinite"}}/>
  );

  return (
    <>
      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>

      {/* Wikipedia image header */}
      <div style={{height:110,background:`linear-gradient(135deg,${meta.color}30,${meta.color}08)`,position:"relative",flexShrink:0,overflow:"hidden"}}>
        {wikiImg && (
          <img src={wikiImg} alt={node.label}
            style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",filter:"brightness(0.75)"}}
            onError={e=>e.target.style.display="none"}/>
        )}
        {wikiLoading && !wikiImg && (
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:28,opacity:0.4}}>{meta.icon}</span>
          </div>
        )}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.8),transparent 55%)"}}/>
        <div style={{position:"absolute",bottom:8,left:10,right:10,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:15}}>{meta.icon}</span>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:"0.08em",background:meta.color+"70",padding:"2px 7px",borderRadius:20}}>{meta.label}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.ink,margin:"0 0 4px"}}>{node.label}</h3>

        {/* Wikipedia summary */}
        {(wikiLoading || wikiSum) && (
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
              <div style={{width:3,height:11,background:"#00BCD4",borderRadius:2}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"#00BCD4",fontWeight:600}}>Wikipedia</span>
            </div>
            {wikiLoading && !wikiSum ? <><Shimmer/><Shimmer/></> :
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.7,margin:0}}>{wikiSum}{wikiSum && "…"}</p>}
          </div>
        )}

        {/* AI Background */}
        {(aiLoading || (sections?.bg && aiContext !== "NO_KEY")) && (
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
              <div style={{width:3,height:11,background:meta.color,borderRadius:2}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:meta.color,fontWeight:600}}>Background</span>
            </div>
            {aiLoading && !sections?.bg ? <><Shimmer/><Shimmer/></> :
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.7,margin:0}}>{sections?.bg}</p>}
          </div>
        )}

        {/* AI Role */}
        {(aiLoading || (sections?.role && aiContext !== "NO_KEY")) && (

          <div style={{marginBottom:10,padding:"9px 11px",background:meta.color+"12",border:`1px solid ${meta.color}30`,borderRadius:8}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
              <div style={{width:3,height:11,background:meta.color,borderRadius:2}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:meta.color,fontWeight:600}}>Role in this board</span>
            </div>
            {aiLoading && !sections?.role ? <Shimmer/> :
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink,lineHeight:1.7,margin:0,fontStyle:"italic"}}>{sections?.role}</p>}
          </div>
        )}

        {/* AI Key insight */}
        {sections?.insight && aiContext !== "NO_KEY" && (
          <div style={{marginBottom:10,padding:"8px 10px",background:T.accentDim,border:`1px solid ${T.accent}30`,borderRadius:8,display:"flex",gap:7,alignItems:"flex-start"}}>
            <span style={{fontSize:14,flexShrink:0}}>💡</span>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink,lineHeight:1.65,margin:0}}>{sections.insight}</p>
          </div>
        )}

        {/* No key prompt */}
        {aiContext === "NO_KEY" && edges.filter(e=>e.from===node.id||e.to===node.id).length > 0 && (
          <div style={{marginBottom:10,padding:"10px 12px",background:T.accentDim,border:`1px solid ${T.accent}40`,borderRadius:8}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.accent,marginBottom:4}}>Add your API key for AI analysis</div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkMid,margin:0,lineHeight:1.6}}>Click <b>Add Key</b> in the top bar to get Background, Role, and Key Insight for every node.</p>
          </div>
        )}
        {!aiLoading && !aiContext && edges.filter(e=>e.from===node.id||e.to===node.id).length===0 && (
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkFaint,fontStyle:"italic",lineHeight:1.6}}>
            Connect this node to others to get AI analysis of its role in the investigation.
          </p>
        )}
      </div>
    </>
  );
}

// ── INVESTIGATE — MODERN PI BOARD ────────────────────────────

const NODE_TYPES = {
  person:      { icon:"👤", color:"#3B82F6", label:"Person"      },
  event:       { icon:"⚡", color:"#8B5CF6", label:"Event"       },
  institution: { icon:"🏛️", color:"#10B981", label:"Institution" },
  concept:     { icon:"💡", color:"#F59E0B", label:"Concept"     },
  place:       { icon:"📍", color:"#EF4444", label:"Place"       },
  law:         { icon:"⚖️", color:"#EC4899", label:"Law"         },
};

const DEFAULT_NODES = [
  { id:"n1", label:"Roman Empire",     type:"institution", x:300, y:180, note:"" },
  { id:"n2", label:"Julius Caesar",    type:"person",      x:520, y:100, note:"" },
  { id:"n3", label:"Silk Road",        type:"concept",     x:720, y:200, note:"" },
  { id:"n4", label:"Byzantine Empire", type:"institution", x:240, y:360, note:"" },
  { id:"n5", label:"Ottoman Empire",   type:"institution", x:520, y:380, note:"" },
];
const DEFAULT_EDGES = [
  {id:"e1",from:"n1",to:"n2",label:"led by"},
  {id:"e2",from:"n1",to:"n3",label:"traded via"},
  {id:"e3",from:"n1",to:"n4",label:"became"},
  {id:"e4",from:"n4",to:"n5",label:"replaced by"},
];

const API_URL_BOARD = import.meta.env.VITE_API_URL || "http://localhost:8000";

function InvestigateSection({ T, nodes: propNodes, edges: propEdges, setNodes: setPropNodes, setEdges: setPropEdges }) {
  const svgRef = useRef(null);
  const nextId = useRef(10);
  const dragOffset = useRef({x:0,y:0});
  const rafRef = useRef(null);

  const [nodes,      setNodesLocal]  = useState(propNodes || DEFAULT_NODES);
  const [edges,      setEdgesLocal]  = useState(propEdges || DEFAULT_EDGES);
  const [dragging,   setDragging]    = useState(null);
  const [selNode,    setSelNode]     = useState(null);
  const [selEdge,    setSelEdge]     = useState(null);
  const [connecting, setConnecting]  = useState(null);
  const [newLabel,   setNewLabel]    = useState("");
  const [newType,    setNewType]     = useState("person");
  const [search,     setSearch]      = useState("");
  const [chatInput,  setChatInput]   = useState("");
  const [chatHistory,setChatHistory] = useState([]);
  const [chatLoading,setChatLoading] = useState(false);
  const [panelTab,   setPanelTab]    = useState("info"); // "info" | "chat"
  const chatEndRef = useRef(null);

  const setNodes = v => { setNodesLocal(v); if(setPropNodes) setPropNodes(v); };
  const setEdges = v => { setEdgesLocal(v); if(setPropEdges) setPropEdges(v); };

  useEffect(()=>{ if(propNodes) setNodesLocal(propNodes); },[propNodes]);
  useEffect(()=>{ if(propEdges) setEdgesLocal(propEdges); },[propEdges]);
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[chatHistory]);

  const visNodes = useMemo(() =>
    search ? nodes.filter(n=>n.label.toLowerCase().includes(search.toLowerCase())) : nodes
  ,[nodes,search]);
  const visIds = useMemo(()=>new Set(visNodes.map(n=>n.id)),[visNodes]);
  const visEdges = useMemo(()=>edges.filter(e=>visIds.has(e.from)&&visIds.has(e.to)),[edges,visIds]);

  const selNodeData = nodes.find(n=>n.id===selNode);
  const selEdgeData = edges.find(e=>e.id===selEdge);
  const isDark = T.name==="dark";

  // ── Drag ────────────────────────────────────────────────────
  const onNodeMouseDown = (e, id) => {
    e.stopPropagation();
    if (connecting !== null) {
      if (connecting !== id) {
        setEdges(prev => {
          if(prev.some(ed=>(ed.from===connecting&&ed.to===id)||(ed.from===id&&ed.to===connecting))) return prev;
          return [...prev,{id:"e"+Date.now(),from:connecting,to:id,label:"related to"}];
        });
      }
      setConnecting(null); return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const node = nodes.find(n=>n.id===id);
    dragOffset.current = {x:e.clientX-rect.left-node.x, y:e.clientY-rect.top-node.y};
    setDragging(id); setSelNode(id); setSelEdge(null);
  };

  const onMouseMove = e => {
    if(!dragging) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(()=>{
      const rect = svgRef.current?.getBoundingClientRect(); if(!rect) return;
      const x = Math.max(80,Math.min(rect.width-80, e.clientX-rect.left-dragOffset.current.x));
      const y = Math.max(30,Math.min(rect.height-30, e.clientY-rect.top-dragOffset.current.y));
      setNodes(prev=>prev.map(n=>n.id===dragging?{...n,x,y}:n));
    });
  };

  const addNode = () => {
    if(!newLabel.trim()) return;
    const id = "n"+(nextId.current++);
    setNodes(prev=>[...prev,{id,label:newLabel.trim(),type:newType,x:300+Math.random()*300,y:150+Math.random()*200,note:""}]);
    setNewLabel("");
  };

  const deleteNode = id => {
    setNodes(prev=>prev.filter(n=>n.id!==id));
    setEdges(prev=>prev.filter(e=>e.from!==id&&e.to!==id));
    setSelNode(null);
  };

  // ── AI Chat with board mutations ────────────────────────────
  const sendChat = async () => {
    if(!chatInput.trim()||chatLoading) return;
    const message = chatInput.trim();
    setChatInput("");
    const userMsg = {role:"user",content:message};
    setChatHistory(h=>[...h,userMsg]);
    setChatLoading(true);

    // Get the question from research context or derive from board
    const topicGuess = nodes.slice(0,3).map(n=>n.label).join(", ");

    try {
      const resp = await fetch(`${API_URL_BOARD}/chat`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          question: topicGuess,
          message,
          nodes: nodes.map(n=>({id:n.id,label:n.label,type:n.type})),
          edges: edges.map(e=>({from:e.from,to:e.to,label:e.label})),
          subject: "history",
          chat_history: chatHistory.slice(-8),
        }),
      });

      if(resp.ok){
        const data = await resp.json();
        const aiMsg = {role:"assistant",content:data.text||""};
        setChatHistory(h=>[...h,aiMsg]);

        // Apply mutations to the live board
        if(data.mutations?.length){
          let newNodes = [...nodes];
          let newEdges = [...edges];
          data.mutations.forEach(mut=>{
            if(mut.type==="add_node"&&mut.node){
              const n = mut.node;
              if(!newNodes.find(x=>x.id===n.id)){
                newNodes = [...newNodes,{
                  ...n,
                  x: 200+Math.random()*500,
                  y: 150+Math.random()*300,
                  note:"",
                }];
              }
            } else if(mut.type==="add_edge"&&mut.edge){
              const e = mut.edge;
              if(!newEdges.find(x=>x.from===e.from&&x.to===e.to)){
                newEdges = [...newEdges,{id:"e"+Date.now()+Math.random(),from:e.from,to:e.to,label:e.label||"related to"}];
              }
            } else if(mut.type==="highlight"&&mut.node_id){
              setSelNode(mut.node_id);
            }
          });
          setNodes(newNodes);
          setEdges(newEdges);
          if(data.mutations.some(m=>m.type==="add_node"||m.type==="add_edge")){
            setChatHistory(h=>[...h,{role:"system",content:`✦ Board updated — ${data.mutations.length} change${data.mutations.length!==1?"s":""} applied`}]);
          }
        }
      } else {
        setChatHistory(h=>[...h,{role:"assistant",content:"Could not reach the research backend. Check that it is running."}]);
      }
    } catch(err){
      setChatHistory(h=>[...h,{role:"assistant",content:"Connection error: "+err.message}]);
    } finally { setChatLoading(false); }
  };

  // ── Edge path ───────────────────────────────────────────────
  const edgePath = edge => {
    const f=nodes.find(n=>n.id===edge.from), t=nodes.find(n=>n.id===edge.to);
    if(!f||!t) return null;
    const dx=t.x-f.x, dy=t.y-f.y, len=Math.sqrt(dx*dx+dy*dy)||1;
    const nx=dx/len, ny=dy/len;
    const sx=f.x+nx*82, sy=f.y+ny*26, ex=t.x-nx*82, ey=t.y-ny*26;
    const mx=(sx+ex)/2-ny*28, my=(sy+ey)/2+nx*28;
    return {path:`M${sx},${sy} Q${mx},${my} ${ex},${ey}`,mx,my};
  };

  const W=156, H=48, rx=12;

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:isDark?"#0A0908":"#F0EDE8",overflow:"hidden"}}>
      <style>{`
        @keyframes dash-flow{to{stroke-dashoffset:-20}}
        @keyframes node-glow{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
        <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNode()}
          placeholder="Add node…"
          style={{padding:"6px 10px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,outline:"none",width:130,caretColor:T.accent}}/>
        <select value={newType} onChange={e=>setNewType(e.target.value)}
          style={{padding:"6px 8px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,outline:"none",cursor:"pointer"}}>
          {Object.entries(NODE_TYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <button onClick={addNode} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",background:T.accent,border:"none",borderRadius:7,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
          <Ic n="plus" s={13} c="#fff"/> Add
        </button>
        <div style={{width:1,height:20,background:T.border}}/>
        <button onClick={()=>setConnecting(c=>c!==null?null:-1)}
          style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",background:connecting!==null?T.info+"25":"transparent",border:`1px solid ${connecting!==null?T.info:T.border}`,borderRadius:7,color:connecting!==null?T.info:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:connecting!==null?700:400,cursor:"pointer",transition:"all 0.2s"}}>
          <Ic n="link" s={13} c="currentColor"/> {connecting!==null?"Click target…":"Connect"}
        </button>
        <div style={{width:1,height:20,background:T.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7}}>
          <Ic n="search" s={12} c={T.inkLight}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter nodes…"
            style={{border:"none",background:"transparent",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,width:90,caretColor:T.accent}}/>
        </div>
        <div style={{flex:1}}/>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight}}>
          <span style={{color:T.accent,fontWeight:700}}>{visNodes.length}</span> nodes ·{" "}
          <span style={{color:T.info,fontWeight:700}}>{visEdges.length}</span> edges
        </span>
      </div>

      {/* ── Canvas + sidebar ────────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* SVG board */}
        <svg ref={svgRef} style={{flex:1,background:isDark?"#0C0B09":"#EDEAE4",cursor:dragging?"grabbing":connecting!==null?"crosshair":"default"}}
          onMouseMove={onMouseMove} onMouseUp={()=>setDragging(null)}
          onClick={e=>{if(e.target===svgRef.current){setSelNode(null);setSelEdge(null);}}}>

          <defs>
            <pattern id="pi-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0L0 0 0 28" fill="none" stroke={isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.05)"} strokeWidth="0.6"/>
            </pattern>
            <filter id="node-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3"/>
            </filter>
            <marker id="arr" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
              <polygon points="0 0,7 3,0 6" fill={isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.2)"}/>
            </marker>
            <marker id="arr-sel" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
              <polygon points="0 0,7 3,0 6" fill={T.accent}/>
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#pi-grid)"/>

          {/* Edges */}
          {visEdges.map(edge=>{
            const ep=edgePath(edge); if(!ep) return null;
            const isSel=selEdge===edge.id;
            const fromNode=nodes.find(n=>n.id===edge.from);
            const edgeColor=isSel?T.accent:fromNode?NODE_TYPES[fromNode.type]?.color+"70":"rgba(150,150,150,0.4)";
            return (
              <g key={edge.id} onClick={e=>{e.stopPropagation();setSelEdge(isSel?null:edge.id);setSelNode(null);}}>
                <path d={ep.path} fill="none" stroke="transparent" strokeWidth="14" style={{cursor:"pointer"}}/>
                <path d={ep.path} fill="none" stroke={edgeColor} strokeWidth={isSel?2.5:1.5}
                  strokeDasharray={isSel?"none":"5 3"}
                  style={isSel?{}:{animation:"dash-flow 1.2s linear infinite"}}
                  markerEnd={isSel?"url(#arr-sel)":"url(#arr)"}/>
                <rect x={ep.mx-30} y={ep.my-9} width={60} height={18} rx={9}
                  fill={isDark?"rgba(18,16,12,0.88)":"rgba(240,237,232,0.92)"}
                  stroke={isSel?T.accent:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"} strokeWidth={isSel?1.5:1}/>
                <text x={ep.mx} y={ep.my+4} textAnchor="middle"
                  style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fill:isSel?T.accent:isDark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.45)",pointerEvents:"none",letterSpacing:"0.03em"}}>
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {visNodes.map(node=>{
            const meta=NODE_TYPES[node.type]||NODE_TYPES.person;
            const isSel=selNode===node.id;
            const isFrom=connecting===node.id;
            const scale=dragging===node.id?1.06:isSel?1.04:1;
            return (
              <g key={node.id}
                transform={`translate(${node.x-W/2},${node.y-H/2}) scale(${scale})`}
                style={{cursor:dragging===node.id?"grabbing":"grab",transformOrigin:`${W/2}px ${H/2}px`,
                  transition:dragging===node.id?"none":"transform 0.15s ease",
                  filter:isSel?`drop-shadow(0 0 12px ${meta.color}60)`:"drop-shadow(0 2px 8px rgba(0,0,0,0.25))"}}
                onMouseDown={e=>onNodeMouseDown(e,node.id)}>

                {/* Glow ring when selected */}
                {(isSel||isFrom)&&(
                  <rect x={-5} y={-5} width={W+10} height={H+10} rx={rx+5}
                    fill="none" stroke={isFrom?T.info:meta.color} strokeWidth="1.5" opacity="0.7"
                    strokeDasharray={isFrom?"4 2":"none"}
                    style={isFrom?{animation:"node-glow 1s ease-in-out infinite"}:{}}/>
                )}

                {/* Card */}
                <rect width={W} height={H} rx={rx}
                  fill={isDark?`rgba(22,20,16,0.95)`:`rgba(255,255,255,0.95)`}
                  stroke={isSel?meta.color:isDark?`${meta.color}50`:`${meta.color}70`}
                  strokeWidth={isSel?2:1.5}/>

                {/* Coloured left strip */}
                <rect width={44} height={H} rx={rx} fill={`${meta.color}25`}/>
                <rect x={rx} y={0} width={44-rx} height={H} fill={`${meta.color}25`}/>

                {/* Divider */}
                <line x1={44} y1={6} x2={44} y2={H-6} stroke={`${meta.color}35`} strokeWidth="1"/>

                {/* Icon */}
                <text x={22} y={H/2+7} textAnchor="middle" style={{fontSize:16,pointerEvents:"none",userSelect:"none"}}>{meta.icon}</text>

                {/* Label */}
                <text x={44+(W-44)/2} y={H/2-4} textAnchor="middle"
                  style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,
                    fill:isDark?"#F5F1EC":"#1C1812",pointerEvents:"none",userSelect:"none"}}>
                  {node.label.length>17?node.label.slice(0,16)+"…":node.label}
                </text>
                <text x={44+(W-44)/2} y={H/2+10} textAnchor="middle"
                  style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fill:meta.color,
                    pointerEvents:"none",userSelect:"none",letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:600}}>
                  {meta.label}
                </text>

                {/* Edge count badge */}
                {edges.filter(e=>e.from===node.id||e.to===node.id).length>0&&(
                  <><circle cx={W-7} cy={7} r={9} fill={meta.color}/>
                  <text x={W-7} y={11} textAnchor="middle"
                    style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,fill:"#fff",pointerEvents:"none",userSelect:"none"}}>
                    {edges.filter(e=>e.from===node.id||e.to===node.id).length}
                  </text></>
                )}
              </g>
            );
          })}

          {/* Hint text */}
          {connecting!=null&&connecting!==-1&&(
            <text x="50%" y="95%" textAnchor="middle"
              style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fill:T.info,pointerEvents:"none"}}>
              Click any node to connect · Escape to cancel
            </text>
          )}
        </svg>

        {/* ── Right panel ──────────────────────────────────── */}
        <div style={{width:280,borderLeft:`1px solid ${T.border}`,background:T.surface,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>

          {/* Panel tabs */}
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            {[["info","🔍 Board"],["chat","💬 AI Chat"]].map(([v,l])=>(
              <button key={v} onClick={()=>setPanelTab(v)}
                style={{flex:1,padding:"10px 8px",background:"transparent",border:"none",borderBottom:panelTab===v?`2px solid ${T.accent}`:"2px solid transparent",color:panelTab===v?T.accent:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:panelTab===v?700:400,cursor:"pointer"}}>
                {l}
              </button>
            ))}
          </div>

          {/* Board info panel */}
          {panelTab==="info"&&(
            <div style={{flex:1,overflowY:"auto"}}>
              {selNodeData&&(
                <div style={{display:"flex",flexDirection:"column",height:"100%",animation:"fade-in 0.2s ease",overflow:"hidden"}}>

                  {/* Wikipedia image + AI context */}
                  <NodeInfoPanel node={selNodeData} nodes={nodes} edges={edges} T={T}/>

                  {/* Divider */}
                  <div style={{borderTop:`1px solid ${T.border}`,flexShrink:0}}/>

                  {/* Connections + Notes + Actions */}
                  <div style={{overflowY:"auto",padding:"10px 14px",flexShrink:0}}>
                    {(()=>{
                      const meta=NODE_TYPES[selNodeData.type]||NODE_TYPES.person;
                      const nodeEdges=edges.filter(e=>e.from===selNodeData.id||e.to===selNodeData.id);
                      return (
                        <>
                          <button onClick={()=>setSelNode(null)} style={{position:"absolute",top:8,right:8,width:20,height:20,borderRadius:"50%",background:"rgba(0,0,0,0.3)",border:"none",color:"rgba(255,255,255,0.7)",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}>✕</button>

                          {/* Connections */}
                          {nodeEdges.length>0&&(
                            <>
                              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:7,fontWeight:600}}>
                                Connections ({nodeEdges.length})
                              </div>
                              {nodeEdges.map((edge,i)=>{
                                const otherId=edge.from===selNodeData.id?edge.to:edge.from;
                                const other=nodes.find(n=>n.id===otherId);
                                const dir=edge.from===selNodeData.id?"→":"←";
                                const otherMeta=NODE_TYPES[other?.type]||NODE_TYPES.person;
                                if(!other) return null;
                                return (
                                  <div key={i} onClick={()=>setSelNode(other.id)}
                                    style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,padding:"6px 8px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,borderLeft:`2.5px solid ${otherMeta.color}`,cursor:"pointer",transition:"background 0.12s"}}
                                    onMouseEnter={e=>e.currentTarget.style.background=T.cardHov}
                                    onMouseLeave={e=>e.currentTarget.style.background=T.card}>
                                    <span style={{fontSize:12}}>{otherMeta.icon}</span>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{dir} {other.label}</div>
                                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:otherMeta.color,fontStyle:"italic"}}>{edge.label}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {/* Notes */}
                          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,margin:"10px 0 5px",fontWeight:600}}>Notes</div>
                          <textarea value={selNodeData.note||""} rows={2}
                            onChange={e=>setNodes(prev=>prev.map(n=>n.id===selNodeData.id?{...n,note:e.target.value}:n))}
                            placeholder="Add investigation notes…"
                            style={{width:"100%",padding:"7px 9px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink,resize:"none",outline:"none",caretColor:T.accent,lineHeight:1.55,boxSizing:"border-box"}}/>

                          {/* Actions */}
                          <div style={{display:"flex",gap:6,marginTop:8}}>
                            <button onClick={()=>setConnecting(selNodeData.id)}
                              style={{flex:1,padding:"6px",background:T.info+"18",border:`1px solid ${T.info}40`,borderRadius:6,color:T.info,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                              🔗 Connect
                            </button>
                            <button onClick={()=>deleteNode(selNodeData.id)}
                              style={{flex:1,padding:"6px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,color:T.danger,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                              🗑 Delete
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {selEdgeData&&!selNodeData&&(()=>{
                const f=nodes.find(n=>n.id===selEdgeData.from);
                const t=nodes.find(n=>n.id===selEdgeData.to);
                if(!f||!t) return null;
                return (
                  <div style={{padding:"14px",animation:"fade-in 0.2s ease"}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:10,fontWeight:600}}>Selected Connection</div>
                    <div style={{padding:"10px 12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:9,marginBottom:12,textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink,marginBottom:3}}>{NODE_TYPES[f.type]?.icon} {f.label}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.accent,fontWeight:700,margin:"4px 0"}}>→ {selEdgeData.label} →</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink}}>{NODE_TYPES[t.type]?.icon} {t.label}</div>
                    </div>
                    <input value={selEdgeData.label} onChange={e=>setEdges(prev=>prev.map(ed=>ed.id===selEdgeData.id?{...ed,label:e.target.value}:ed))}
                      style={{width:"100%",padding:"7px 10px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,outline:"none",boxSizing:"border-box",marginBottom:8,caretColor:T.accent}}/>
                    <button onClick={()=>{setEdges(prev=>prev.filter(e=>e.id!==selEdgeData.id));setSelEdge(null);}}
                      style={{width:"100%",padding:"7px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.danger,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                      Delete connection
                    </button>
                  </div>
                );
              })()}

              {!selNodeData&&!selEdgeData&&(
                <div style={{padding:"16px"}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:12,fontWeight:600}}>Node Types</div>
                  {Object.entries(NODE_TYPES).map(([k,v])=>(
                    <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{width:28,height:28,borderRadius:7,background:`${v.color}20`,border:`1.5px solid ${v.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{v.icon}</div>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid}}>{v.label}</span>
                    </div>
                  ))}
                  <div style={{marginTop:14,padding:"10px 12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkFaint,fontWeight:600,marginBottom:6}}>Tips</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,lineHeight:1.65}}>
                      Drag nodes freely.<br/>
                      Click <b style={{color:T.ink}}>Connect</b> then click two nodes.<br/>
                      Use the <b style={{color:T.accent}}>AI Chat</b> tab to ask questions and auto-update the board.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Chat panel */}
          {panelTab==="chat"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{flex:1,overflowY:"auto",padding:"12px 12px 4px"}}>
                {chatHistory.length===0&&(
                  <div style={{padding:"20px 0",textAlign:"center",color:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:12,lineHeight:1.7}}>
                    Ask about the board, add connections, or request deeper analysis.<br/>
                    <span style={{color:T.accent,fontSize:11}}>The AI can edit this board in real time.</span>
                  </div>
                )}
                {chatHistory.map((msg,i)=>{
                  if(msg.role==="system") return (
                    <div key={i} style={{margin:"6px 0",padding:"5px 10px",background:T.accent+"18",border:`1px solid ${T.accent}30`,borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.accent,animation:"fade-in 0.2s ease"}}>{msg.content}</div>
                  );
                  const isUser=msg.role==="user";
                  return (
                    <div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",marginBottom:8,animation:"fade-in 0.2s ease"}}>
                      <div style={{maxWidth:"88%",padding:"8px 11px",background:isUser?T.accent:T.card,borderRadius:isUser?"12px 12px 4px 12px":"12px 12px 12px 4px",border:isUser?"none":`1px solid ${T.border}`}}>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:isUser?"#fff":T.ink,margin:0,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
                {chatLoading&&(
                  <div style={{display:"flex",gap:4,padding:"8px 12px",animation:"fade-in 0.2s ease"}}>
                    {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:T.accent,animation:`node-glow 1s ease-in-out ${i*0.2}s infinite`}}/>)}
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>
              <div style={{padding:"10px 12px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
                <div style={{display:"flex",gap:6}}>
                  <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()}
                    placeholder="Ask anything about this board…"
                    style={{flex:1,padding:"8px 10px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink,outline:"none",caretColor:T.accent}}
                  />
                  <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()}
                    style={{padding:"8px 12px",background:chatLoading||!chatInput.trim()?T.border:T.accent,border:"none",borderRadius:8,cursor:chatLoading||!chatInput.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Ic n="send" s={14} c="#fff"/>
                  </button>
                </div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint,marginTop:5,textAlign:"center"}}>
                  Enter to send · AI can add nodes and edges to the board
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





// ── VR EXPLORER ───────────────────────────────────────────────
// Honest status: immersive 3D history in the browser is genuinely
// hard. See VRSection for the full technical explanation shown to users.

const VR_SITES = [
  { id:"great-pyramid",  name:"Great Pyramid of Giza",         region:"Egypt",       era:"2560 BCE", type:"civilization",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/640px-Kheops-Pyramid.jpg",
    description:"The last surviving Wonder of the Ancient World. Remained the tallest structure on Earth for 3,800 years. Its astronomical alignment still baffles engineers.",
    facts:["Originally 146.5 m tall — tallest structure for 3,800 years","~2.3 million blocks, some weighing 80 tonnes","Aligned to true north within 0.05 degrees","Internal temperature constant at 20°C"],
    wikiUrl:"https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza",
    mapsUrl:"https://maps.google.com/?q=29.9792,31.1342",
    youtubeQuery:"Great Pyramid of Giza 360 virtual tour",
    artsUrl:"https://artsandculture.google.com/search?q=great+pyramid+giza" },
  { id:"colosseum",      name:"The Colosseum — Rome",           region:"Italy",       era:"80 CE",    type:"world",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/640px-Colosseo_2020.jpg",
    description:"The largest amphitheatre ever built, seating up to 80,000. Its engineering influenced stadium design for 2,000 years.",
    facts:["Held 50,000–80,000 spectators","Built in just 8–10 years","80 entrances — crowds could empty in minutes","Underground hypogeum held animals and stage machinery"],
    wikiUrl:"https://en.wikipedia.org/wiki/Colosseum",
    mapsUrl:"https://maps.google.com/?q=41.8902,12.4922",
    youtubeQuery:"Colosseum Rome 360 virtual tour",
    artsUrl:"https://artsandculture.google.com/search?q=colosseum+rome" },
  { id:"machu-picchu",   name:"Machu Picchu",                  region:"Peru",        era:"1450 CE",  type:"world",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/640px-Machu_Picchu%2C_Peru.jpg",
    description:"Inca citadel at 2,430 m in the Andes. Stones fit without mortar — a knife blade cannot pass between them. Unknown to the outside world until 1911.",
    facts:["Built at 2,430 m — above the clouds","Stones fit without mortar","Earthquake-resistant design","Rediscovered by Hiram Bingham in 1911"],
    wikiUrl:"https://en.wikipedia.org/wiki/Machu_Picchu",
    mapsUrl:"https://maps.google.com/?q=-13.1631,-72.5450",
    youtubeQuery:"Machu Picchu 360 virtual tour drone",
    artsUrl:"https://artsandculture.google.com/search?q=machu+picchu" },
  { id:"parthenon",      name:"The Parthenon — Athens",        region:"Greece",      era:"432 BCE",  type:"world",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/The_Parthenon_in_Athens.jpg/640px-The_Parthenon_in_Athens.jpg",
    description:"Temple of Athena on the Acropolis. Its lines are subtly curved — optical illusions making it appear perfectly straight. The most influential building in Western architecture.",
    facts:["Has no perfectly straight lines","46 outer columns, each slightly different","Held a 12m ivory and gold statue of Athena","The Elgin Marbles: still in London, Greece demands return"],
    wikiUrl:"https://en.wikipedia.org/wiki/Parthenon",
    mapsUrl:"https://maps.google.com/?q=37.9715,23.7267",
    youtubeQuery:"Parthenon Athens Acropolis 360 virtual tour",
    artsUrl:"https://artsandculture.google.com/search?q=parthenon+athens" },
  { id:"angkor-wat",     name:"Angkor Wat",                    region:"Cambodia",    era:"1150 CE",  type:"world",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Angkor_Wat_as_seen_from_the_air.JPG/640px-Angkor_Wat_as_seen_from_the_air.JPG",
    description:"The world's largest religious monument — 402 acres built by the Khmer Empire. Bas-relief galleries stretch 800 metres depicting the entire Hindu cosmological universe.",
    facts:["World's largest religious monument: 402 acres","800 m of bas-relief galleries","Built for Suryavarman II","Moat required 30 million cubic metres of earth"],
    wikiUrl:"https://en.wikipedia.org/wiki/Angkor_Wat",
    mapsUrl:"https://maps.google.com/?q=13.4124,103.8667",
    youtubeQuery:"Angkor Wat 360 virtual tour Cambodia",
    artsUrl:"https://artsandculture.google.com/search?q=angkor+wat" },
  { id:"great-wall",     name:"Great Wall of China",           region:"China",       era:"221 BCE",  type:"world",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Badaling_great_wall.jpg/640px-Badaling_great_wall.jpg",
    description:"21,000+ km of fortifications built over centuries. Never a single wall but a network. Millions died building it — their bones said to be in the foundations.",
    facts:["Total length: 21,196 km","2,000+ years and multiple dynasties to build","400,000+ workers died during construction","Visible from orbit — but NOT from the Moon (a myth)"],
    wikiUrl:"https://en.wikipedia.org/wiki/Great_Wall_of_China",
    mapsUrl:"https://maps.google.com/?q=40.4319,116.5704",
    youtubeQuery:"Great Wall of China 360 virtual tour",
    artsUrl:"https://artsandculture.google.com/search?q=great+wall+china" },
  { id:"hagia-sophia",   name:"Hagia Sophia — Istanbul",       region:"Turkey",      era:"537 CE",   type:"empire",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hagia_Sophia_Mars_2013.jpg/640px-Hagia_Sophia_Mars_2013.jpg",
    description:"World's largest cathedral for 1,000 years. Its dome appeared to float — a revolutionary engineering feat. Changed religion three times: cathedral, mosque, museum, mosque.",
    facts:["Largest cathedral for 1,000 years (537–1520 CE)","Dome is 55.6 m high","Changed religion 3 times","The floating dome was architecturally revolutionary"],
    wikiUrl:"https://en.wikipedia.org/wiki/Hagia_Sophia",
    mapsUrl:"https://maps.google.com/?q=41.0086,28.9802",
    youtubeQuery:"Hagia Sophia Istanbul 360 virtual tour inside",
    artsUrl:"https://artsandculture.google.com/search?q=hagia+sophia" },
  { id:"stonehenge",     name:"Stonehenge",                    region:"England",     era:"2500 BCE", type:"indigenous",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Stonehenge2007_07_30.jpg/640px-Stonehenge2007_07_30.jpg",
    description:"Prehistoric monument on Salisbury Plain. Largest stones transported 250 km from Wales. Aligned with the summer solstice sunrise and winter solstice sunset.",
    facts:["Built 3000–1500 BCE in phases","Largest stones: 25 tonnes from 250 km away","Aligned with summer solstice sunrise","Purpose still debated: burial site? Solar calendar? Healing centre?"],
    wikiUrl:"https://en.wikipedia.org/wiki/Stonehenge",
    mapsUrl:"https://maps.google.com/?q=51.1789,-1.8262",
    youtubeQuery:"Stonehenge 360 virtual tour",
    artsUrl:"https://artsandculture.google.com/search?q=stonehenge" },
  { id:"taj-mahal",      name:"Taj Mahal",                     region:"India",       era:"1653 CE",  type:"empire",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/640px-Taj_Mahal_%28Edited%29.jpeg",
    description:"Built by Shah Jahan for his wife Mumtaz Mahal. 22 years, 20,000 workers. Marble changes colour — pink at dawn, white at noon, golden at night.",
    facts:["22 years, 20,000 workers, 1,000 elephants","Marble: pink at dawn, white at noon, golden at night","Minarets lean outward — to fall away from the tomb in earthquakes","Shah Jahan died imprisoned, looking at the Taj from his cell"],
    wikiUrl:"https://en.wikipedia.org/wiki/Taj_Mahal",
    mapsUrl:"https://maps.google.com/?q=27.1751,78.0421",
    youtubeQuery:"Taj Mahal 360 virtual tour inside",
    artsUrl:"https://artsandculture.google.com/search?q=taj+mahal" },
  { id:"pompeii",        name:"Pompeii",                       region:"Italy",       era:"79 CE",    type:"world",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Pompeii_Street.jpg/640px-Pompeii_Street.jpg",
    description:"Roman city buried under 6 metres of volcanic ash in 79 CE. Preserved perfectly — streets, graffiti, food in ovens, plaster casts of citizens in their final moments.",
    facts:["Buried in ash in 18–20 hours","Preserved for 1,700 years, rediscovered 1748","Electoral campaign graffiti still legible","Plaster casts of victims made by pouring plaster into ash voids"],
    wikiUrl:"https://en.wikipedia.org/wiki/Pompeii",
    mapsUrl:"https://maps.google.com/?q=40.7509,14.4989",
    youtubeQuery:"Pompeii ancient ruins 360 virtual tour walk",
    artsUrl:"https://artsandculture.google.com/search?q=pompeii" },
  { id:"great-zimbabwe", name:"Great Zimbabwe",                region:"Zimbabwe",    era:"1100 CE",  type:"civilization",
    thumbnail:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Great_Zimbabwe_02.jpg/640px-Great_Zimbabwe_02.jpg",
    description:"Largest pre-colonial stone structure in sub-Saharan Africa. 720 hectares of dry-stone walls, no mortar. Housed 18,000 people and controlled Indian Ocean trade.",
    facts:["Largest pre-colonial structure in sub-Saharan Africa","Built without mortar across 720 hectares","Housed 18,000 people at peak (1300–1450 CE)","European colonisers denied Africans built it — history was suppressed for decades"],
    wikiUrl:"https://en.wikipedia.org/wiki/Great_Zimbabwe",
    mapsUrl:"https://maps.google.com/?q=-20.2745,30.9338",
    youtubeQuery:"Great Zimbabwe ruins virtual tour",
    artsUrl:"https://artsandculture.google.com/search?q=great+zimbabwe" },
];

function VRSection({ T }) {
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");

  const filtered = useMemo(() => {
    if (!search) return VR_SITES;
    const q = search.toLowerCase();
    return VR_SITES.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.region.toLowerCase().includes(q) ||
      s.era.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }, [search]);

  const isDark = T.name === "dark";

  // ── Site detail view ───────────────────────────────────────
  if (selected) return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>

      {/* Top bar */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"10px 18px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={()=>setSelected(null)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,color:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer"}}>
          <Ic n="chevL" s={12} c="currentColor"/> Back
        </button>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.ink}}>{selected.name}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>{selected.region} · {selected.era}</div>
        </div>
        <div style={{flex:1}}/>
        <a href={selected.mapsUrl} target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",gap:6,padding:"6px 13px",background:"#1a73e820",border:"1px solid #1a73e850",borderRadius:7,color:"#1a73e8",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,textDecoration:"none"}}>
          <Ic n="pin" s={12} c="currentColor"/> Open in Google Maps
        </a>
        <a href={selected.wikiUrl} target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",gap:5,padding:"6px 13px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,color:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:11,textDecoration:"none"}}>
          <Ic n="extlink" s={11} c="currentColor"/> Wikipedia
        </a>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
        <div style={{maxWidth:820,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

          {/* Hero image */}
          <div style={{gridColumn:"1/-1",borderRadius:12,overflow:"hidden",height:260,position:"relative",background:"#1a1410"}}>
            <img src={selected.thumbnail} alt={selected.name}
              style={{width:"100%",height:"100%",objectFit:"cover"}}
              onError={e=>{e.target.style.display="none";}}/>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.6),transparent 50%)"}}/>
            <div style={{position:"absolute",bottom:14,left:18}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#fff",margin:"0 0 3px"}}>{selected.name}</h2>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.65)"}}>{selected.region} · {selected.era}</div>
            </div>
          </div>

          {/* About */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:10}}>About this site</div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,lineHeight:1.75,margin:"0 0 14px"}}>{selected.description}</p>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:8}}>Key facts</div>
            {selected.facts.map((f,i) => (
              <div key={i} style={{display:"flex",gap:8,marginBottom:7,paddingBottom:7,borderBottom:i<selected.facts.length-1?`1px solid ${T.border}`:"none"}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:T.accent,flexShrink:0,marginTop:5}}/>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.6}}>{f}</span>
              </div>
            ))}
          </div>

          {/* Explore elsewhere */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:14}}>Explore this site</div>

            {/* Resources */}
            {[
              { icon:"🗺️", label:"View on Google Maps", sub:"Satellite and street-level imagery", href:selected.mapsUrl, color:"#1a73e8" },
              { icon:"🎬", label:"360° Tour on YouTube", sub:"Search virtual walkthroughs and drone footage", href:`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.youtubeQuery)}`, color:"#FF0000" },
              { icon:"🖼️", label:"Google Arts & Culture", sub:"High-res photography and curator stories", href:selected.artsUrl, color:"#EA4335" },
              { icon:"📖", label:"Wikipedia", sub:"Full historical context and references", href:selected.wikiUrl, color:T.info },
            ].map((r,i) => (
              <a key={i} href={r.href} target="_blank" rel="noopener noreferrer"
                style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 11px",marginBottom:i<3?8:0,background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,textDecoration:"none",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=r.color+"50";e.currentTarget.style.transform="translateX(2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";}}>
                <span style={{fontSize:20,flexShrink:0}}>{r.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.ink,marginBottom:2}}>{r.label}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>{r.sub}</div>
                </div>
                <Ic n="extlink" s={12} c={T.inkFaint}/>
              </a>
            ))}

            {/* Why no immersive 3D here */}
            <div style={{marginTop:14,padding:"11px 13px",background:isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)",border:`1px solid ${T.border}`,borderRadius:9}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:T.inkLight,marginBottom:5}}>Why no in-app 360° viewer?</div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkFaint,lineHeight:1.65,margin:0}}>
                True photospheres require specialized camera rigs. Embedding third-party 360° viewers introduces licensing, CORS restrictions, and iframes that break. Google Maps and YouTube deliver the best experience for this — we link you directly there.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Browse grid ────────────────────────────────────────────
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>

      {/* Header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.ink,margin:0}}>Historical Sites</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight,margin:"2px 0 0"}}>
            Explore the world's greatest sites — via Google Maps, YouTube 360° tours, and Google Arts & Culture
          </p>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,minWidth:220}}>
          <Ic n="search" s={13} c={T.inkLight}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search historical sites…"
            style={{border:"none",background:"transparent",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,flex:1,caretColor:T.accent}}/>
          {search && <span onClick={()=>setSearch("")} style={{cursor:"pointer",color:T.inkFaint,fontSize:12}}>✕</span>}
        </div>
      </div>

      {/* Honest notice */}
      <div style={{padding:"9px 20px",background:isDark?"rgba(251,191,36,0.07)":"rgba(251,191,36,0.06)",borderBottom:"1px solid rgba(251,191,36,0.2)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <span style={{fontSize:15}}>⚠️</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:isDark?"#FCD34D":"#92400E",lineHeight:1.5}}>
          <b>In-browser immersive 3D for historical sites isn't ready yet.</b> True photospheres need specialist camera equipment; embedding third-party viewers introduces licensing and CORS issues.
          {" "}<b>For each site below we link directly to Google Maps, YouTube 360° tours, and Google Arts & Culture</b> — which all do this better than any iframe could.
        </span>
      </div>

      {/* Site grid */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
        {filtered.length === 0 && (
          <div style={{textAlign:"center",padding:"60px 0",color:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
            No sites match "{search}"
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:18}}>
          {filtered.map(site => (
            <div key={site.id}
              style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.18)`;e.currentTarget.style.borderColor=T.accent+"50";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=T.border;}}
              onClick={()=>{ track("site", { label: site.name, region: site.region }); setSelected(site); }}>

              {/* Thumbnail */}
              <div style={{height:155,position:"relative",overflow:"hidden",background:"#1a1410"}}>
                <img src={site.thumbnail} alt={site.name}
                  style={{width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.82)",transition:"transform 0.4s"}}
                  onMouseEnter={e=>e.target.style.transform="scale(1.05)"}
                  onMouseLeave={e=>e.target.style.transform="scale(1)"}
                  onError={e=>{e.target.style.display="none";}}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.72),transparent 52%)"}}/>
                <div style={{position:"absolute",bottom:8,left:10,right:10}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.2}}>{site.name}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"rgba(255,255,255,0.6)",marginTop:2}}>{site.region} · {site.era}</div>
                </div>
              </div>

              {/* Card body */}
              <div style={{padding:"11px 13px"}}>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.65,margin:"0 0 10px"}}>
                  {site.description.slice(0,100)}…
                </p>
                <div style={{display:"flex",gap:6}}>
                  <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer"
                    onClick={e=>e.stopPropagation()}
                    style={{flex:1,padding:"6px 0",textAlign:"center",background:"#1a73e815",border:"1px solid #1a73e840",borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#1a73e8",textDecoration:"none"}}>
                    🗺️ Maps
                  </a>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(site.youtubeQuery)}`} target="_blank" rel="noopener noreferrer"
                    onClick={e=>e.stopPropagation()}
                    style={{flex:1,padding:"6px 0",textAlign:"center",background:"#FF000015",border:"1px solid #FF000040",borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#FF0000",textDecoration:"none"}}>
                    🎬 360° Tour
                  </a>
                  <div style={{flex:1,padding:"6px 0",textAlign:"center",background:T.accentDim,border:`1px solid ${T.accent}40`,borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:T.accent}}>
                    Learn more →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Phase 3 roadmap note */}
        <div style={{marginTop:28,padding:"16px 20px",background:isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)",border:`1px solid ${T.border}`,borderRadius:10,display:"flex",gap:14,alignItems:"flex-start"}}>
          <span style={{fontSize:22,flexShrink:0}}>🚀</span>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.ink,marginBottom:5}}>Phase 3 — AI Historical Reconstruction (out of scope for now)</div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.7,margin:0}}>
              Generating walkable historical environments in-browser requires NeRF or Gaussian Splatting models trained on multi-view imagery, plus a WebGL streaming pipeline — not practical in a single-page app today.
              True photospheres also need 360° camera rigs (Ricoh Theta, Insta360) that historical institutions rarely make openly available.
              We're watching this space closely — a dedicated post on the roadmap is coming.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── JOURNEY SECTION ───────────────────────────────────────────
function JourneySection({ T, onNavigate }) {
  const [data,       setData]       = useState(getJourneyData);
  const [showClear,  setShowClear]  = useState(false);
  const isDark = T.name === "dark";

  const refresh = () => setData(getJourneyData());

  const handleClear = () => {
    clearJourney();
    setData({ events:[] });
    setShowClear(false);
  };

  const events = data.events || [];

  // ── Derived stats ────────────────────────────────────────────
  const today     = new Date().toISOString().slice(0,10);
  const uniqueDays= [...new Set(events.map(e=>e.d))].sort();
  const streak    = (() => {
    if(!uniqueDays.length) return 0;
    let count = 0, cur = new Date();
    for(let i=uniqueDays.length-1;i>=0;i--){
      const d = uniqueDays[i];
      const expected = cur.toISOString().slice(0,10);
      if(d===expected){ count++; cur.setDate(cur.getDate()-1); }
      else if(d < expected) break;
    }
    return count;
  })();

  const totalTopics   = new Set(events.filter(e=>e.label).map(e=>e.label)).size;
  const learnEvents   = events.filter(e=>e.type==="learn");
  const exploreEvents = events.filter(e=>e.type==="explore");
  const timelineEvents= events.filter(e=>e.type==="timeline");
  const siteEvents    = events.filter(e=>e.type==="site");

  // Region coverage
  const ALL_REGIONS = ["Africa","Asia","Europe","Americas","Middle East","Pacific","Worldwide"];
  const touchedRegions = new Set(
    events.filter(e=>e.region).map(e=>{
      const r = e.region;
      for(const reg of ALL_REGIONS) if(r.toLowerCase().includes(reg.toLowerCase())) return reg;
      return null;
    }).filter(Boolean)
  );

  // Era coverage from timeline events
  const ALL_ERAS = ["prehistory","outafrica","neolithic","firstkings","classical","medieval","empires","contact","slavetrade","colonial","independence","present"];
  const touchedEras = new Set(events.filter(e=>e.era).map(e=>e.era));

  // Section breakdown
  const sectionCounts = {
    explore: exploreEvents.length,
    learn:   learnEvents.length,
    timeline:timelineEvents.length,
    sites:   siteEvents.length,
    research:events.filter(e=>e.type==="section"&&e.label==="research").length,
  };
  const sectionTotal = Object.values(sectionCounts).reduce((a,b)=>a+b,0)||1;

  // Activity heatmap — last 84 days (12 weeks)
  const heatmap = (() => {
    const counts = {};
    events.forEach(e=>{ counts[e.d] = (counts[e.d]||0)+1; });
    const days = [];
    for(let i=83;i>=0;i--){
      const d = new Date(); d.setDate(d.getDate()-i);
      const key = d.toISOString().slice(0,10);
      days.push({ date:key, count:counts[key]||0, dow:d.getDay() });
    }
    return days;
  })();
  const heatMax = Math.max(...heatmap.map(d=>d.count),1);

  // Recent activity — last 12 unique events with labels
  const recent = [...events].reverse().filter(e=>e.label).slice(0,12);

  // Top topics
  const topicCounts = {};
  events.filter(e=>e.label).forEach(e=>{ topicCounts[e.label]=(topicCounts[e.label]||0)+1; });
  const topTopics = Object.entries(topicCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);

  const TYPE_COLORS = {
    learn:"#3B82F6", explore:"#10B981", timeline:"#9B59B6",
    site:"#F59E0B", research:"#EF4444", section:"rgba(255,255,255,0.2)"
  };
  const TYPE_LABELS = {
    learn:"Learn", explore:"Globe", timeline:"Timeline",
    site:"Sites", research:"Research", section:"Navigation"
  };

  const ERA_LABELS = {
    prehistory:"Prehistory", outafrica:"Out of Africa", neolithic:"First Civilizations",
    firstkings:"Ancient World", classical:"Classical Age", medieval:"Medieval Period",
    empires:"Age of Empires", contact:"Exploration", slavetrade:"Colonialism",
    colonial:"Revolutions", independence:"World Wars", present:"Modern Era"
  };

  if(events.length === 0) return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bg,padding:32,textAlign:"center"}}>
      <div style={{fontSize:44,marginBottom:16}}>🌍</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.ink,margin:"0 0 10px"}}>Your learning journey starts here</h2>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.inkMid,lineHeight:1.75,maxWidth:420,margin:"0 0 24px"}}>
        As you explore civilizations, people, timelines, and historical sites, Severus tracks your journey — <b>locally and anonymously</b>. No accounts, no servers, nothing leaves your device.
      </p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
        {[["Explore","explore"],["Learn","learn"],["Timeline","timeline"],["Sites","vr"]].map(([l,id])=>(
          <button key={id} onClick={()=>onNavigate(id)}
            style={{padding:"10px 20px",background:T.accent,border:"none",borderRadius:8,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            Start with {l} →
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>

      {/* Header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"12px 22px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:T.ink,margin:0}}>Your Learning Journey</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,margin:"2px 0 0"}}>
            Tracked locally · never leaves your device · no account required
          </p>
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>setShowClear(v=>!v)}
          style={{padding:"6px 13px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.inkFaint,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer"}}>
          {showClear?"Cancel":"Clear data"}
        </button>
        {showClear&&(
          <button onClick={handleClear}
            style={{padding:"6px 13px",background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:7,color:"#EF4444",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            Yes, clear everything
          </button>
        )}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 22px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>

          {/* ── Stat cards ─────────────────────────────────────── */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
            {[
              { icon:"🔥", label:"Day Streak",    value:streak,             sub:streak===1?"day in a row":`days in a row` },
              { icon:"📚", label:"Topics Explored",value:totalTopics,        sub:"unique topics" },
              { icon:"🌍", label:"Regions Touched", value:touchedRegions.size,sub:`of ${ALL_REGIONS.length} world regions` },
              { icon:"⏳", label:"Eras Explored",  value:touchedEras.size,   sub:`of ${ALL_ERAS.length} historical eras` },
            ].map((s,i)=>(
              <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
                <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:T.accent,lineHeight:1}}>{s.value}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.ink,marginTop:4}}>{s.label}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,marginTop:2}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Activity heatmap ────────────────────────────────── */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px",marginBottom:16}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:12}}>Activity — last 12 weeks</div>
            <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:4}}>
              {Array.from({length:12},(_,week)=>(
                <div key={week} style={{display:"flex",flexDirection:"column",gap:3}}>
                  {Array.from({length:7},(_,dow)=>{
                    const idx = week*7+dow;
                    const day = heatmap[idx];
                    if(!day) return <div key={dow} style={{width:11,height:11}}/>;
                    const intensity = day.count===0?0:Math.max(0.15,day.count/heatMax);
                    const isToday = day.date===today;
                    return (
                      <div key={dow} title={`${day.date}: ${day.count} interaction${day.count!==1?"s":""}`}
                        style={{width:11,height:11,borderRadius:2,
                          background:day.count===0
                            ?(isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)")
                            :`rgba(255,87,34,${intensity})`,
                          border:isToday?`1px solid ${T.accent}`:"none",
                          cursor:"default"}}/>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint}}>12 weeks ago</span>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint}}>Less</span>
                {[0.06,0.2,0.45,0.75,1].map((o,i)=>(
                  <div key={i} style={{width:10,height:10,borderRadius:2,background:`rgba(255,87,34,${o})`}}/>
                ))}
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint}}>More</span>
              </div>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint}}>Today</span>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>

            {/* ── Region coverage ──────────────────────────────── */}
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:14}}>
                World Region Coverage — {touchedRegions.size}/{ALL_REGIONS.length}
              </div>
              {ALL_REGIONS.map(reg=>{
                const touched = touchedRegions.has(reg);
                const count   = events.filter(e=>e.region&&e.region.toLowerCase().includes(reg.toLowerCase())).length;
                return (
                  <div key={reg} style={{marginBottom:9}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:touched?T.ink:T.inkFaint,fontWeight:touched?600:400}}>{reg}</span>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>{count} interaction{count!==1?"s":""}</span>
                    </div>
                    <div style={{height:5,borderRadius:3,background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.07)"}}>
                      <div style={{height:"100%",borderRadius:3,width:`${Math.min(100,(count/Math.max(...ALL_REGIONS.map(r=>events.filter(e=>e.region&&e.region.toLowerCase().includes(r.toLowerCase())).length),1)))*100}%`,background:touched?T.accent:"transparent",transition:"width 0.6s ease"}}/>
                    </div>
                  </div>
                );
              })}
              {touchedRegions.size < ALL_REGIONS.length && (
                <div style={{marginTop:10,padding:"7px 10px",background:T.accentDim,border:`1px solid ${T.accent}30`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.accent}}>
                  💡 You haven't explored {ALL_REGIONS.filter(r=>!touchedRegions.has(r)).join(" or ")} yet
                </div>
              )}
            </div>

            {/* ── Era coverage ─────────────────────────────────── */}
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:14}}>
                Historical Era Coverage — {touchedEras.size}/{ALL_ERAS.length}
              </div>
              {ALL_ERAS.map(era=>{
                const touched = touchedEras.has(era);
                return (
                  <div key={era} style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
                    <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,
                      background:touched?T.accent:(isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)")}}/>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:touched?T.ink:T.inkFaint,fontWeight:touched?500:400,flex:1}}>
                      {ERA_LABELS[era]||era}
                    </span>
                    {touched&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.success}}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>

            {/* ── Section breakdown ─────────────────────────────── */}
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:14}}>Where you spend time</div>
              {Object.entries(sectionCounts).map(([sec,count])=>{
                const pct = Math.round((count/sectionTotal)*100);
                const col = TYPE_COLORS[sec]||T.accent;
                return (
                  <div key={sec} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink,fontWeight:500}}>{TYPE_LABELS[sec]||sec}</span>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>{count} · {pct}%</span>
                    </div>
                    <div style={{height:6,borderRadius:3,background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.07)"}}>
                      <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:col,transition:"width 0.6s ease"}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Top topics ───────────────────────────────────── */}
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:14}}>Most explored topics</div>
              {topTopics.length===0
                ? <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkFaint,margin:0}}>No topics explored yet</p>
                : topTopics.map(([label,count],i)=>(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"6px 8px",background:T.surface,borderRadius:7}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:T.inkFaint,width:16,textAlign:"right",flexShrink:0}}>#{i+1}</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,flexShrink:0}}>{count}×</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ── Recent activity feed ─────────────────────────────── */}
          {recent.length>0&&(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:12}}>Recent activity</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
                {recent.map((ev,i)=>{
                  const col=TYPE_COLORS[ev.type]||T.accent;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",background:T.surface,borderRadius:8,borderLeft:`3px solid ${col}`}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ev.label}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkLight,marginTop:2}}>
                          {TYPE_LABELS[ev.type]||ev.type}{ev.region?` · ${ev.region}`:""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Privacy note */}
          <div style={{marginTop:16,padding:"11px 14px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:9,display:"flex",gap:9,alignItems:"flex-start"}}>
            <span style={{fontSize:14,flexShrink:0}}>🔒</span>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkFaint,margin:0,lineHeight:1.65}}>
              All data above is stored exclusively in your browser's localStorage. Nothing is sent to any server. Severus has no account system and cannot see any of this. You can clear it at any time using the button above.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}


// ── HOME ──────────────────────────────────────────────────────
function Home({ T, onNavigate }) {
  const [vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),60);return()=>clearTimeout(t);},[]);
  const a=(d=0)=>({opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(14px)",transition:`opacity 0.6s ease ${d}s,transform 0.6s ease ${d}s`});
  const heroBg=T.name==="dark"?"linear-gradient(160deg,#2A1800 0%,#1A0E00 40%,#0D1A18 100%)":"linear-gradient(160deg,#3A1800 0%,#5C2400 40%,#1A3830 100%)";

  const sectionCards=[
    {id:"explore",     label:"Explore",      icon:"globe",    colorKey:"info",    tagline:"The Interactive Globe",  desc:"Navigate human history from 315,000 BCE. African civilizations, world empires, diaspora communities."},
    {id:"timeline",    label:"Timeline",     icon:"clock",    colorKey:"accent",  tagline:"300,000 BCE → Present",  desc:"Every era, every turning point. From human origins to today — on one scrollable timeline."},
    {id:"learn",       label:"Learn",        icon:"book",     colorKey:"info",    tagline:"People & Civilizations", desc:"Kings, scholars, warriors, activists. From Julius Caesar to Genghis Khan — every civilisation that shaped today."},
    {id:"vr",          label:"Sites",        icon:"pin",      colorKey:"success", tagline:"Historical Sites",        desc:"Explore 11 of the world's greatest historical sites with facts, maps, 360° tours, and Google Arts & Culture."},
    {id:"investigate", label:"Investigate",  icon:"connect",  colorKey:"slate",   tagline:"The PI Board",           desc:"Drop nodes, draw connections, follow any thread. AI builds and edits the connection graph in real time."},
    {id:"research",    label:"Research",     icon:"ai",       colorKey:"success", tagline:"AI Research Suite",      desc:"AI agents answer any history question — African, Asian, European, American. Ask anything."},
  ];

  return (
    <div style={{height:"100%",overflowY:"auto",background:T.bg,transition:"background 0.3s"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"36px 40px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20,marginBottom:20}}>
          <div style={{...a(0),background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{height:190,background:heroBg,position:"relative",overflow:"hidden",padding:"24px 28px",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
              <div style={{position:"absolute",inset:0,opacity:0.06}}>{[0,1,2,3,4,5].map(i=><div key={i} style={{position:"absolute",borderRadius:"50%",border:`1px solid ${T.accent}`,width:160+i*80,height:160+i*80,top:"50%",left:"30%",transform:"translate(-50%,-50%)"}}/>)}</div>
              <div style={{position:"relative"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:T.accent,fontWeight:600,marginBottom:8}}>Free for every student, everywhere</div>
                <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,fontWeight:700,color:"#FCF9F7",lineHeight:1.15,margin:0}}>The History<br/>Every Student<br/><em style={{color:T.accent}}>Deserves to Know</em></h1>
              </div>
            </div>
            <div style={{padding:"20px 24px",flex:1}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.inkMid,lineHeight:1.8,margin:"0 0 20px"}}>300 million students worldwide have no access to quality history education. Severus changes that — free AI-powered investigation of world history for any student on any device. From the Mongol Empire to the Haitian Revolution, from Ancient Mesopotamia to the Silk Road. Every civilisation. Every story.</p>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>onNavigate("explore")} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",background:T.accent,border:"none",borderRadius:7,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em"}} onMouseEnter={e=>e.currentTarget.style.background=T.accentMid} onMouseLeave={e=>e.currentTarget.style.background=T.accent}>Start Investigating <Ic n="arrowR" s={14} c="#fff"/></button>
                <button onClick={()=>onNavigate("research")} style={{padding:"10px 18px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.inkLight;e.currentTarget.style.color=T.ink;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.inkMid;}}>Ask the AI →</button>
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{...a(0.08),background:T.name==="dark"?T.surface:T.ink,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(252,249,247,0.3)",marginBottom:18,fontWeight:600}}>Platform Scope</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {[{n:300,suf:"M+",label:"Students without textbooks",d:100},{n:36000,suf:"+",label:"Slave Voyages Documented",d:250},{n:500,suf:"+",label:"Civilizations & Nations",d:400},{n:0,suf:"$",label:"Cost to any student",d:550}].map((s,i)=>(
                  <div key={i} style={{paddingBottom:i<2?14:0,borderBottom:i<2?"1px solid rgba(252,249,247,0.08)":"none"}}>
                    <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:700,color:T.accent,lineHeight:1,marginBottom:4}}><Counter to={s.n} suffix={s.suf} delay={s.d}/></div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(252,249,247,0.35)"}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{...a(0.14),background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px",flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:T.inkLight,fontWeight:600}}>Knowledge Depth</span>
                <Ic n="flame" s={14} c={T.accent}/>
              </div>
              <PBar label="Ancient Civilizations" pct={84} color={T.accent}  T={T} delay={0}/>
              <PBar label="Migration & Diaspora"      pct={62} color={T.info}    T={T} delay={120}/>
              <PBar label="Empires & Conquest"      pct={78} color={T.danger}  T={T} delay={240}/>
              <PBar label="Artifact Provenance"   pct={55} color={T.success} T={T} delay={360}/>
            </div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
          {sectionCards.map(s=>{
            const c=colOf(T,s.colorKey);
            return (
              <div key={s.id} onClick={()=>onNavigate(s.id)}
                style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px",cursor:"pointer",transition:"all 0.2s",display:"flex",flexDirection:"column",gap:10}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=c+"55";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px rgba(0,0,0,${T.name==="dark"?0.25:0.08})`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{width:34,height:34,borderRadius:8,background:c+(T.name==="dark"?"22":"15"),display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={s.icon} s={16} c={c}/></div>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",padding:"2px 8px",borderRadius:20,background:c+(T.name==="dark"?"22":"12"),color:c,border:`1px solid ${c}40`}}>Active</span>
                </div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:700,color:T.ink,marginBottom:2}}>{s.label}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:c,fontWeight:500}}>{s.tagline}</div>
                </div>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight,lineHeight:1.65,margin:0}}>{s.desc}</p>
              </div>
            );
          })}
        </div>

        <div style={{padding:"18px 22px",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,display:"flex",alignItems:"center",gap:18}}>
          <img src={severusLogo} alt="Severus" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,lineHeight:1.7,margin:0,flex:1}}>
            Named after <strong style={{color:T.ink,fontWeight:600}}>Septimius Severus</strong> — born in Leptis Magna, North Africa, 145 CE. Emperor of Rome, 193 CE. A reminder that great civilisations have always been more connected, more diverse, and more intertwined than history books admit. <em style={{color:T.accent}}>Every student deserves to know this.</em>
          </p>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",color:T.inkFaint,textAlign:"right",flexShrink:0}}>Free Forever<br/>All Sources Cited</div>
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────
function Sidebar({ active, onNavigate, open, T, piNewCount=0 }) {
  return (
    <div style={{width:open?228:60,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transition:"width 0.28s cubic-bezier(0.4,0,0.2,1)",flexShrink:0,zIndex:30,overflow:"hidden"}}>
      <div style={{padding:open?"20px 18px 16px":"20px 0 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12,justifyContent:open?"flex-start":"center",flexShrink:0}}>
        <img src={severusLogo} alt="S" style={{width:32,height:32,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
        {open&&<div style={{overflow:"hidden",whiteSpace:"nowrap"}}>
          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:700,color:T.ink,letterSpacing:"0.04em"}}>SEVERUS</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkLight,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:1}}>History for Every Student · v1</div>
        </div>}
      </div>
      <nav style={{flex:1,padding:"10px 8px",overflowY:"auto",overflowX:"hidden"}}>
        {open&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:T.inkFaint,padding:"4px 10px 8px",fontWeight:600}}>Navigation</div>}
        {SECTIONS.map(s=>{
          const isActive=active===s.id,c=colOf(T,s.colorKey);
          const showBadge = s.id==="investigate" && piNewCount>0;
          return (
            <div key={s.id} onClick={()=>onNavigate(s.id)} title={!open?s.label:""}
              style={{display:"flex",alignItems:"center",gap:10,padding:open?"9px 10px":"9px 0",justifyContent:open?"flex-start":"center",borderRadius:8,cursor:"pointer",marginBottom:2,background:isActive?c+"18":"transparent",borderLeft:open&&isActive?`2px solid ${c}`:"2px solid transparent",transition:"all 0.15s",whiteSpace:"nowrap",overflow:"hidden",position:"relative"}}
              onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background=T.card;}}
              onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent";}}
            >
              <Ic n={s.icon} s={16} c={isActive?c:T.inkLight}/>
              {open&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:isActive?600:400,color:isActive?c:T.inkMid,flex:1}}>{s.label}</span>}
              {open && showBadge && (
                <div style={{minWidth:18,height:18,borderRadius:9,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:700,color:"#fff"}}>{piNewCount}</span>
                </div>
              )}
              {!open&&isActive&&<div style={{position:"absolute",left:0,top:"25%",bottom:"25%",width:2,background:c,borderRadius:"0 2px 2px 0"}}/>}
              {!open&&showBadge&&<div style={{position:"absolute",top:6,right:6,width:7,height:7,borderRadius:"50%",background:T.accent}}/>}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// ── TOPBAR ────────────────────────────────────────────────────

// ── API KEY MANAGEMENT ────────────────────────────────────────

const ANTHROPIC_KEY_STORAGE = "severus_anthropic_key";

function useAnthropicKey() {
  const [key, setKeyState] = useState(() => {
    try { return localStorage.getItem(ANTHROPIC_KEY_STORAGE) || ""; } catch { return ""; }
  });
  const setKey = (k) => {
    setKeyState(k);
    try { if (k) localStorage.setItem(ANTHROPIC_KEY_STORAGE, k); else localStorage.removeItem(ANTHROPIC_KEY_STORAGE); } catch {}
  };
  const clearKey = () => setKey("");
  const isValid  = key.startsWith("sk-ant-") && key.length > 20;
  return { key, setKey, clearKey, isValid };
}

// Global key accessor for components that don't receive it as a prop
function getStoredKey() {
  try { return localStorage.getItem(ANTHROPIC_KEY_STORAGE) || ""; } catch { return ""; }
}

function SettingsModal({ T, onClose }) {
  const { key, setKey, clearKey, isValid } = useAnthropicKey();
  const [draft,   setDraft]   = useState(key);
  const [visible, setVisible] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // "ok" | "fail" | null

  const handleSave = () => {
    setKey(draft.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!draft.trim().startsWith("sk-ant-")) { setTestResult("fail"); return; }
    setTesting(true); setTestResult(null);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": draft.trim(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "Hi" }] }),
      });
      setTestResult(resp.ok ? "ok" : "fail");
    } catch { setTestResult("fail"); }
    finally { setTesting(false); }
  };

  const masked = draft ? draft.slice(0, 12) + "••••••••••••" + draft.slice(-4) : "";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>

      <div style={{width:480,background:T.card,borderRadius:14,border:`1px solid ${T.border}`,boxShadow:"0 24px 64px rgba(0,0,0,0.4)",overflow:"hidden"}}>

        {/* Header */}
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:9,background:T.accent+"20",border:`1px solid ${T.accent}40`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ic n="key" s={18} c={T.accent}/>
          </div>
          <div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:T.ink,margin:0}}>API Keys</h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight,margin:0}}>Severus is open source — bring your own key</p>
          </div>
          <button onClick={onClose} style={{marginLeft:"auto",background:"transparent",border:"none",cursor:"pointer",color:T.inkLight,fontSize:18,lineHeight:1,padding:4}}>✕</button>
        </div>

        {/* Body */}
        <div style={{padding:"20px 22px"}}>

          {/* Explainer */}
          <div style={{padding:"12px 14px",background:T.accent+"10",border:`1px solid ${T.accent}25`,borderRadius:9,marginBottom:20,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0}}>🔒</span>
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.ink,marginBottom:4}}>Your key never leaves your browser</div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,margin:0,lineHeight:1.65}}>
                Stored only in <code style={{background:T.surface,padding:"1px 5px",borderRadius:4,fontSize:10}}>localStorage</code> on your device.
                When used, it goes directly from <b>your browser → Anthropic's API</b> — it never touches Severus servers.
                Severus is open source: you can <a href="https://github.com/Perucy/severus" target="_blank" rel="noopener noreferrer" style={{color:T.accent}}>verify this in the code</a>.
              </p>
            </div>
          </div>

          {/* Anthropic key input */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
              <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:T.ink}}>
                Anthropic API Key
              </label>
              {isValid && (
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.success,fontWeight:600}}>✓ Saved</span>
              )}
            </div>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:T.surface,border:`1px solid ${isValid?T.success+"60":T.border}`,borderRadius:8,transition:"border-color 0.15s"}}>
                <Ic n="key" s={13} c={isValid?T.success:T.inkFaint}/>
                <input
                  type={visible?"text":"password"}
                  value={draft}
                  onChange={e=>{ setDraft(e.target.value); setTestResult(null); setSaved(false); }}
                  placeholder="sk-ant-api03-…"
                  style={{flex:1,border:"none",background:"transparent",outline:"none",fontFamily:"monospace",fontSize:12,color:T.ink,caretColor:T.accent}}
                />
                <button onClick={()=>setVisible(v=>!v)}
                  style={{background:"transparent",border:"none",cursor:"pointer",color:T.inkFaint,fontSize:11,padding:"2px 4px"}}>
                  {visible?"Hide":"Show"}
                </button>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
              <button onClick={handleSave} disabled={!draft.trim()}
                style={{padding:"7px 16px",background:draft.trim()?T.accent:T.border,border:"none",borderRadius:7,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:draft.trim()?"pointer":"not-allowed",transition:"background 0.15s"}}>
                {saved?"✓ Saved!":"Save Key"}
              </button>
              <button onClick={handleTest} disabled={testing||!draft.trim()}
                style={{padding:"7px 14px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:testing||!draft.trim()?"not-allowed":"pointer"}}>
                {testing?"Testing…":"Test Key"}
              </button>
              {key && (
                <button onClick={()=>{ clearKey(); setDraft(""); setTestResult(null); }}
                  style={{padding:"7px 14px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.danger,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",marginLeft:"auto"}}>
                  Clear
                </button>
              )}
            </div>

            {/* Test result */}
            {testResult === "ok" && (
              <div style={{marginTop:10,padding:"8px 12px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#10B981"}}>
                ✓ Key is valid — Anthropic API responded successfully
              </div>
            )}
            {testResult === "fail" && (
              <div style={{marginTop:10,padding:"8px 12px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#EF4444"}}>
                ✗ Key invalid or request failed — check your key at console.anthropic.com
              </div>
            )}
          </div>

          {/* What it unlocks */}
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.inkLight,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>What your key unlocks</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[
                ["🔍","PI Board — Node AI Analysis","Wikipedia + AI context when you click any node"],
                ["💬","PI Board — AI Chat","Ask questions and let the AI update your board in real time"],
                ["🔬","Research — Full Pipeline","Historian, Investigator, Visualizer, Guide agents"],
              ].map(([icon,title,desc])=>(
                <div key={title} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",background:T.surface,borderRadius:8}}>
                  <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
                  <div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.ink}}>{title}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>{desc}</div>
                  </div>
                  <div style={{marginLeft:"auto",padding:"2px 8px",borderRadius:20,background:isValid?"rgba(16,185,129,0.15)":T.accentDim,border:`1px solid ${isValid?"rgba(16,185,129,0.3)":T.accent+"30"}`,fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,color:isValid?"#10B981":T.accent,whiteSpace:"nowrap",flexShrink:0}}>
                    {isValid?"Active":"Needs key"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Get key link */}
          <div style={{marginTop:16,textAlign:"center"}}>
            <a href="https://console.anthropic.com/keys" target="_blank" rel="noopener noreferrer"
              style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.info,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:5}}>
              <Ic n="extlink" s={11} c="currentColor"/> Get an Anthropic API key at console.anthropic.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


function TopBar({ active, onNavigate, onToggle, theme, onToggleTheme, T, onOpenSettings, hasKey }) {
  const section=SECTIONS.find(s=>s.id===active);
  const c=section?colOf(T,section.colorKey):T.accent;
  return (
    <div style={{height:52,borderBottom:`1px solid ${T.border}`,background:T.name==="dark"?"rgba(20,18,16,0.97)":"rgba(250,250,248,0.97)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",padding:"0 20px",gap:14,flexShrink:0,zIndex:20}}>
      <button onClick={onToggle} style={{background:"transparent",border:"none",cursor:"pointer",padding:7,borderRadius:7,color:T.inkLight,display:"flex"}} onMouseEnter={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.color=T.ink;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.inkLight;}}><Ic n="menu" s={17} c="currentColor"/></button>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span onClick={()=>onNavigate("home")} style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.accent,cursor:"pointer",letterSpacing:"0.04em"}}>SEVERUS</span>
        {section&&section.id!=="home"&&<><Ic n="chevR" s={13} c={T.inkFaint}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:c,fontWeight:500}}>{section.label}</span></>}
      </div>
      <div style={{flex:1}}/>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,cursor:"text",minWidth:200}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent+"50"} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
        <Ic n="search" s={13} c={T.inkLight}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkLight,flex:1}}>Search Severus…</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkFaint,background:T.surface,border:`1px solid ${T.border}`,borderRadius:4,padding:"1px 6px"}}>⌘K</span>
      </div>
      <button onClick={onToggleTheme} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 13px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,transition:"all 0.18s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+"50";e.currentTarget.style.color=T.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.inkMid;}}>
        <Ic n={theme==="dark"?"sun":"moon"} s={14} c="currentColor"/><span>{theme==="dark"?"Light":"Dark"}</span>
      </button>
      <button onClick={onOpenSettings}
        style={{display:"flex",alignItems:"center",gap:7,padding:"7px 13px",background:hasKey?"rgba(16,185,129,0.1)":T.card,border:`1px solid ${hasKey?"rgba(16,185,129,0.4)":T.border}`,borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:hasKey?"#10B981":T.inkMid,transition:"all 0.18s"}}
        title={hasKey?"API key configured — click to manage":"No API key — click to add yours"}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+"50";e.currentTarget.style.color=T.accent;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=hasKey?"rgba(16,185,129,0.4)":T.border;e.currentTarget.style.color=hasKey?"#10B981":T.inkMid;}}>
        <Ic n="key" s={14} c="currentColor"/>
        <span>{hasKey?"Key ✓":"Add Key"}</span>
      </button>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────
export default function App() {
  const [active,   setActive]   = useState("home");
  const [sideOpen, setSideOpen] = useState(true);
  const [theme,    setTheme]    = useState("dark");
  const T = theme==="dark" ? DARK : LIGHT;
  const { key: anthropicKey, setKey: setAnthropicKey, isValid: hasKey } = useAnthropicKey();
  const [showSettings, setShowSettings] = useState(false);

  // ── Shared PI board state ──────────────────────────────────
  const [piNodes,    setPiNodes]    = useState(DEFAULT_NODES);
  const [piEdges,    setPiEdges]    = useState(DEFAULT_EDGES);
  const [piNewCount, setPiNewCount] = useState(0);

  // ── Persistent research state (survives tab switches) ──────
  const [researchState, setResearchState] = useState(null);

  const pushToBoard = (newNodes, newEdges) => {
    // Replace placeholder defaults entirely on first push from Research
    setPiNodes(prev => {
      const isDefault = prev.length === DEFAULT_NODES.length &&
        prev.every(n => DEFAULT_NODES.some(d => d.id === n.id));
      const base = isDefault ? [] : prev;
      const existingLabels = new Set(base.map(n => n.label.toLowerCase()));
      const toAdd = newNodes.filter(n => !existingLabels.has(n.label.toLowerCase()));
      return [...base, ...toAdd];
    });
    setPiEdges(prev => {
      const isDefault = prev.length === DEFAULT_EDGES.length &&
        prev.every(e => DEFAULT_EDGES.some(d => d.id === e.id));
      const base = isDefault ? [] : prev;
      return [...base, ...newEdges];
    });
    setPiNewCount(c => c + newNodes.length);
  };

  const clearBadge = () => setPiNewCount(0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{overflow:hidden;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.2);border-radius:4px;}
        *{-webkit-font-smoothing:antialiased;}
        ::selection{background:rgba(255,87,34,0.25);}
        input::placeholder{color:${T.inkLight};}
        select option{background:${T.card};color:${T.ink};}
      `}</style>

      {showSettings && <SettingsModal T={T} onClose={()=>setShowSettings(false)}/>}

      <div style={{display:"flex",height:"100vh",background:T.bg,overflow:"hidden",transition:"background 0.3s"}}>
        <Sidebar active={active} onNavigate={(id)=>{
          track("section", { label: id });
          setActive(id);
          if(id==="investigate") clearBadge();
        }} open={sideOpen} T={T} piNewCount={piNewCount}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
          <TopBar active={active} onNavigate={setActive} onToggle={()=>setSideOpen(v=>!v)} theme={theme} onToggleTheme={()=>setTheme(t=>t==="dark"?"light":"dark")} T={T} onOpenSettings={()=>setShowSettings(true)} hasKey={hasKey}/>
          <div style={{flex:1,overflow:"hidden"}}>
            {active==="home"        && <Home        T={T} onNavigate={setActive}/>}
            {active==="explore"     && <ExploreSection     T={T} theme={theme}/>}
            {active==="timeline"    && <TimelineSection    T={T}/>}
            {active==="learn"       && <LearnSection       T={T}/>}
            {active==="vr"          && <VRSection          T={T}/>}
            {active==="investigate" && <InvestigateSection T={T} nodes={piNodes} edges={piEdges} setNodes={setPiNodes} setEdges={setPiEdges}/>}
            {active==="research"    && <ResearchSection    T={T} onPushToBoard={pushToBoard} onNavigate={setActive} savedState={researchState} onSaveState={setResearchState}/>}
            {active==="journey"     && <JourneySection     T={T} onNavigate={setActive}/>}
          </div>
        </div>
      </div>
    </>
  );
}