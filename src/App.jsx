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
  { id:"origins",      label:"Human Origins",      year:-315000 },
  { id:"spread",       label:"African Spread",     year:-150000 },
  { id:"outafrica",    label:"Out of Africa",       year:-70000  },
  { id:"neolithic",    label:"Neolithic",           year:-10000  },
  { id:"firstkings",   label:"First Kingdoms",      year:-3100   },
  { id:"classical",    label:"Classical Age",       year:-500    },
  { id:"medieval",     label:"Medieval Africa",     year:700     },
  { id:"empires",      label:"Great Empires",       year:1300    },
  { id:"contact",      label:"First Contact",       year:1500    },
  { id:"slavetrade",   label:"Slave Trade",         year:1619    },
  { id:"colonial",     label:"Colonialism",         year:1884    },
  { id:"independence", label:"Independence",        year:1960    },
  { id:"present",      label:"Present Day",         year:2024    },
];

const TYPE_META = {
  origin:        { label:"Human Origin",         color:"#FFD700" },
  civilization:  { label:"Ancient Civilization", color:"#FF5722" },
  indigenous:    { label:"Indigenous People",    color:"#009AD8" },
  diaspora:      { label:"African Diaspora",     color:"#4CAF7D" },
  accountability:{ label:"Accountability",       color:"#E03030" },
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
];

const MIGRATIONS = [
  { id:"s-spread",  label:"Southern African Spread",    from:[3.5,36.5],  to:[-22,21],    startYear:-100000, color:"#FFD700" },
  { id:"w-spread",  label:"West African Spread",        from:[3.5,36.5],  to:[7.5,4.5],   startYear:-70000,  color:"#FFC200" },
  { id:"nile",      label:"Nile Corridor",              from:[3.5,36.5],  to:[27,30.5],   startYear:-60000,  color:"#FFAA00" },
  { id:"oot",       label:"Out of Africa — Coastal",    from:[3.5,36.5],  to:[12.4,92.9], startYear:-70000,  color:"#45D4D4" },
  { id:"melanesia", label:"Into Melanesia",             from:[12.4,92.9], to:[-6,147],    startYear:-65000,  color:"#3DB8CC" },
  { id:"bantu",     label:"Bantu Expansion",            from:[4,10],      to:[-20,31],    startYear:-3000,   color:"#FF8C00" },
  { id:"transsah",  label:"Trans-Saharan Trade",        from:[13.5,-8],   to:[33,3],      startYear:-1000,   color:"#FFA040" },
  { id:"indian",    label:"Indian Ocean Trade",         from:[-6.2,39.2], to:[14.8,74.5], startYear:700,     color:"#709AD8" },
  { id:"s-carib",   label:"Middle Passage → Caribbean", from:[6.4,2.1],   to:[18.5,-72.5],startYear:1503,    color:"#E03030" },
  { id:"s-braz",    label:"Middle Passage → Brazil",    from:[0,12],      to:[-12.9,-38.3],startYear:1502,   color:"#C82020" },
  { id:"s-usa",     label:"Middle Passage → N. America",from:[7.5,4.5],   to:[32,-82],    startYear:1619,    color:"#B01010" },
  { id:"col-congo", label:"Colonial Extraction",        from:[-4,24],     to:[50.8,4.4],  startYear:1885,    color:"#8B3030" },
  { id:"panafrican",label:"Pan-African Movement",       from:[18.5,-72.5],to:[5.6,-0.2],  startYear:1920,    color:"#4CAF7D" },
  { id:"mod-europe",label:"Modern African Diaspora",    from:[14,15],     to:[48.8,2.3],  startYear:1950,    color:"#708090" },
];

// ── TIMELINE DATA ─────────────────────────────────────────────
const TIMELINE_EVENTS = [
  { year:-315000, era:"origins",      title:"Homo Sapiens Emerge",         region:"Africa",        type:"origin",         desc:"The first anatomically modern humans appear in Africa. Jebel Irhoud skulls (Morocco, 315,000 BCE) and Omo remains (Ethiopia, 195,000 BCE) are our oldest fossils.", impact:"The origin of all 8 billion humans alive today." },
  { year:-200000, era:"origins",      title:"Mitochondrial Eve",           region:"East Africa",   type:"origin",         desc:"All living humans trace their mitochondrial DNA to a single woman who lived in East Africa approximately 200,000 years ago.", impact:"Scientific confirmation that Africa is the mother of all humanity." },
  { year:-150000, era:"spread",       title:"San Peoples Diverge",         region:"Southern Africa",type:"indigenous",     desc:"The San (Bushmen) lineage diverges from all other human populations — making them Earth's oldest continuous culture.", impact:"150,000+ years of unbroken cultural tradition — the longest on Earth." },
  { year:-70000,  era:"outafrica",    title:"Out of Africa Migration",     region:"Horn of Africa", type:"origin",         desc:"A small group of Homo sapiens crosses from East Africa into Arabia. Every non-African human alive today descends from this migration.", impact:"The migration that populated every continent on Earth." },
  { year:-65000,  era:"outafrica",    title:"First Pacific Crossing",      region:"Southeast Asia", type:"origin",         desc:"Humans use primitive watercraft to cross open ocean to Melanesia and Australia — the first ocean voyage in human history.", impact:"Proved human ingenuity and boldness 65,000 years before recorded history." },
  { year:-10000,  era:"neolithic",    title:"Saharan Green Period",        region:"North Africa",   type:"civilization",   desc:"The Sahara is a lush grassland with lakes and rivers. African peoples develop agriculture, art, and permanent settlements across the region.", impact:"The Sahara fed African civilisations for millennia before becoming desert." },
  { year:-8000,   era:"neolithic",    title:"African Agriculture",         region:"Sub-Saharan Africa",type:"civilization", desc:"Independent development of agriculture in multiple African regions — the Sahel, Ethiopian Highlands, and West African forests.", impact:"Africa independently discovered farming — not a gift from elsewhere." },
  { year:-3100,   era:"firstkings",   title:"Ancient Egypt Founded",       region:"North Africa",   type:"civilization",   desc:"Narmer unifies Upper and Lower Egypt, founding one of the world's first nation-states. The civilisation Egyptians called 'Kemet' — the Black Land.", impact:"3,000 years of a civilisation that built the pyramids, wrote the first medical texts, and invented formal mathematics." },
  { year:-2500,   era:"firstkings",   title:"Kingdom of Kush Rises",       region:"Sudan",          type:"civilization",   desc:"Kush emerges as a major power in the Nile Valley, eventually building more pyramids than Egypt and producing the world's greatest iron technology.", impact:"Kush proved African civilisation did not begin and end at Egypt's borders." },
  { year:-1350,   era:"firstkings",   title:"Nefertiti & Akhenaten",       region:"Egypt",          type:"civilization",   desc:"Queen Nefertiti and Pharaoh Akhenaten revolutionise Egyptian religion, introducing proto-monotheism that likely influenced the Abrahamic faiths.", impact:"The first known monotheistic revolution in human history — from Africa." },
  { year:-500,    era:"classical",    title:"Yoruba Civilisation",         region:"West Africa",    type:"civilization",   desc:"Ile-Ife emerges as the spiritual and political centre of Yoruba civilisation, developing sophisticated bronze casting and a complex religious system.", impact:"A religion that would survive the Middle Passage and thrive on 4 continents." },
  { year:-332,    era:"classical",    title:"Alexander in Egypt",          region:"North Africa",   type:"accountability", desc:"Alexander the Great conquers Egypt, beginning the Greek Ptolemaic period. The first major instance of non-African powers claiming African civilisational heritage.", impact:"The beginning of the systematic erasure of African contributions to world civilisation." },
  { year:330,     era:"medieval",     title:"Axum Adopts Christianity",    region:"Ethiopia",       type:"civilization",   desc:"King Ezana of Axum adopts Christianity — making Ethiopia one of the world's first Christian nations, 60 years before the Roman Empire.", impact:"The Ethiopian Orthodox Church is older than European Christianity." },
  { year:700,     era:"medieval",     title:"Swahili Coast Flourishes",    region:"East Africa",    type:"civilization",   desc:"The Swahili Coast city-states become the world's most sophisticated Indian Ocean trading network, connecting Africa to Arabia, Persia, India and China.", impact:"Africa was the hub of global trade 800 years before Columbus." },
  { year:900,     era:"medieval",     title:"Great Zimbabwe Built",        region:"Southern Africa",type:"civilization",   desc:"The Shona people begin construction of Great Zimbabwe — sub-Saharan Africa's largest pre-colonial stone monument, without mortar.", impact:"Proof that sophisticated monumental architecture existed across sub-Saharan Africa." },
  { year:1235,    era:"empires",      title:"Mali Empire Founded",         region:"West Africa",    type:"civilization",   desc:"Sundiata Keita founds the Mali Empire after defeating the Sosso. Within a century it controls more than half the world's gold and salt supply.", impact:"The beginning of what would become the world's wealthiest empire." },
  { year:1324,    era:"empires",      title:"Mansa Musa's Pilgrimage",     region:"West Africa",    type:"civilization",   desc:"Mansa Musa I travels to Mecca with 60,000 people and 100 camels loaded with gold. He gives away so much gold that he crashes Egypt's economy for a decade.", impact:"Mansa Musa's wealth remains the benchmark for the richest person in all of history." },
  { year:1375,    era:"empires",      title:"Songhai Empire Rises",        region:"West Africa",    type:"civilization",   desc:"The Songhai expand to become the largest empire in West African history, with Timbuktu as its intellectual capital.", impact:"Timbuktu's Sankore University housed 25,000 students — more than the University of Oxford at the time." },
  { year:1441,    era:"contact",      title:"First Portuguese Slave Raid", region:"West Africa",    type:"accountability", desc:"Portuguese sailors conduct the first European slave raid on the African coast, capturing 12 Africans. This is the beginning of the transatlantic slave trade.", impact:"The start of a system that would forcibly displace over 12 million people." },
  { year:1485,    era:"contact",      title:"Portugal Meets Benin",        region:"Nigeria",        type:"civilization",   desc:"Portuguese traders reach the Kingdom of Benin. They are stunned by its sophistication, size and the quality of its bronze art.", impact:"Europeans documented that Africa had advanced civilisations — then proceeded to destroy them." },
  { year:1502,    era:"slavetrade",   title:"First African Slaves in Americas",region:"Americas",   type:"accountability", desc:"The first enslaved Africans arrive in the Americas (Hispaniola). Over the next 350 years, more than 12.5 million will be transported.", impact:"The beginning of the largest forced migration in human history." },
  { year:1526,    era:"slavetrade",   title:"Kongolese King Protests",     region:"Central Africa", type:"accountability", desc:"King Afonso I of the Kongo writes to the King of Portugal demanding the slave trade stop, as it is destroying his kingdom. Portugal ignores him.", impact:"One of the earliest documented protests against the transatlantic slave trade — by an African king." },
  { id:"palmares-e",year:1605,era:"slavetrade",title:"Quilombo dos Palmares",region:"Brazil",      type:"diaspora",       desc:"Escaped enslaved Africans establish Palmares — a free republic in the Brazilian interior. It survives 90 years and grows to 30,000 people.", impact:"Proof that freedom was always being fought for — not gifted." },
  { year:1619,    era:"slavetrade",   title:"First Africans in English America",region:"Virginia, USA",type:"accountability",desc:"The first enslaved Africans arrive in English North America at Point Comfort, Virginia, aboard a privateer ship.", impact:"The start of African American history — 400 years of building America from the ground up." },
  { year:1660,    era:"slavetrade",   title:"Royal African Company",       region:"England",        type:"accountability", desc:"The English Crown charters the Royal African Company with the Duke of York (later King James II) as its governor. It becomes the largest slave-trading enterprise in history.", impact:"The British state — not just merchants — was the engine of the slave trade." },
  { year:1688,    era:"slavetrade",   title:"Lloyd's Insures Enslaved People",region:"London",     type:"accountability", desc:"Lloyd's of London begins insuring enslaved Africans as cargo — treating humans as livestock and providing the financial backbone of the trade.", impact:"Lloyd's only publicly acknowledged this history in 2020. The institution still exists today." },
  { year:1804,    era:"slavetrade",   title:"Haitian Revolution Succeeds", region:"Haiti",          type:"diaspora",       desc:"On January 1, 1804, Haiti declares independence — the world's first Black republic, created by defeating Napoleon's professional army in a 13-year war.", impact:"The only successful slave revolt in human history. It terrified slaveholders across the Americas and accelerated abolition." },
  { year:1833,    era:"slavetrade",   title:"British Abolition Act",       region:"Britain",        type:"accountability", desc:"Britain abolishes slavery — but pays £20 million compensation to slave OWNERS, not the enslaved. The British public finished paying off this loan in 2015.", impact:"British taxpayers paid the descendants of slave owners until 2015. The enslaved received nothing." },
  { year:1884,    era:"colonial",     title:"Berlin Conference",           region:"Europe",         type:"accountability", desc:"14 European powers meet in Berlin to divide Africa amongst themselves. Zero African representatives are present. They draw borders splitting 177 ethnic groups.", impact:"These artificial borders created today's African nations and directly cause many of the continent's contemporary conflicts." },
  { year:1885,    era:"colonial",     title:"Leopold's Congo Horror",      region:"Congo",          type:"accountability", desc:"Belgium's King Leopold II establishes personal ownership of the Congo. His rubber-extraction regime kills an estimated 10 million Congolese.", impact:"The first genocide of the 20th century — largely ignored in European history education." },
  { year:1896,    era:"colonial",     title:"Ethiopia Defeats Italy at Adwa",region:"Ethiopia",    type:"diaspora",       desc:"Ethiopia's Emperor Menelik II defeats the Italian army at the Battle of Adwa — the only African nation to successfully defeat a European colonial army.", impact:"Adwa became a symbol of African resistance and Black liberation worldwide." },
  { year:1897,    era:"colonial",     title:"Benin Bronzes Looted",        region:"Nigeria",        type:"accountability", desc:"British forces mount a 'punitive expedition' on the Kingdom of Benin, looting over 3,000 bronze artworks. Most remain in Western museums today.", impact:"The Benin Bronzes are at the centre of the global repatriation debate. Their theft represents the cultural genocide of colonialism." },
  { year:1920,    era:"colonial",     title:"Harlem Renaissance",          region:"New York, USA",  type:"diaspora",       desc:"An explosion of African American art, literature and music redefines global culture. Jazz, blues, Langston Hughes, Duke Ellington.", impact:"African Americans gave the 20th century much of its cultural soul — while still being denied basic rights." },
  { year:1945,    era:"colonial",     title:"Pan-African Congress",        region:"Manchester, UK", type:"diaspora",       desc:"The Fifth Pan-African Congress brings together Kwame Nkrumah, Jomo Kenyatta and W.E.B. Du Bois to plan the independence of Africa.", impact:"The blueprint for the decolonisation of an entire continent." },
  { year:1957,    era:"independence", title:"Ghana Independence",          region:"Ghana",          type:"diaspora",       desc:"Ghana becomes the first sub-Saharan African country to gain independence, led by Kwame Nkrumah. 'Ghana is free forever!'", impact:"Triggered the wave of African independence movements across the continent in the 1960s." },
  { year:1960,    era:"independence", title:"Year of Africa",              region:"Africa",         type:"civilization",   desc:"17 African nations gain independence in a single year. The era of formal European colonialism in Africa effectively ends.", impact:"The continent throws off 80 years of colonial rule. A new chapter begins — but colonial structures remain." },
  { year:1963,    era:"independence", title:"Organisation of African Unity",region:"Ethiopia",      type:"civilization",   desc:"32 African nations found the Organisation of African Unity in Addis Ababa — a continental institution for African self-determination.", impact:"The precursor to the African Union, which today represents 55 nations and 1.4 billion people." },
  { year:1994,    era:"present",      title:"End of Apartheid",            region:"South Africa",   type:"diaspora",       desc:"Nelson Mandela becomes South Africa's first democratically elected president, ending 46 years of apartheid.", impact:"The last formal system of racial segregation in the world ends — 340 years after the Cape Colony was founded." },
  { year:2020,    era:"present",      title:"Global Reckoning",            region:"Worldwide",      type:"accountability", desc:"The murder of George Floyd triggers global Black Lives Matter protests across 60 countries. Statues of slave traders are pulled down. Museums face repatriation demands.", impact:"The global conversation about slavery's legacy — and who still benefits from it — finally breaks into the mainstream." },
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
];

// ── ACCOUNTABILITY RECORDS ────────────────────────────────────
const ACCOUNTABILITY = {
  ships: [
    { name:"Zong", year:1781, owner:"Luke Collingwood / Gregson Syndicate", route:"West Africa → Jamaica", cargo:"442 enslaved Africans", incident:"Captain threw 132 living enslaved Africans overboard to claim insurance money. The resulting court case — which treated the murders as property damage — helped spark the British abolition movement.", source:"Zong massacre, 1781 — National Archives UK" },
    { name:"Brooks", year:1788, owner:"Joseph Brooks Jr.", route:"Liverpool → West Africa → Caribbean", cargo:"Up to 609 enslaved Africans", incident:"The Brooks became the face of the abolitionist movement when Thomas Clarkson published a diagram showing 482 humans packed into its hold like cargo. The image shocked Britain.", source:"Regulated Slave Trade Act 1788 — Wilberforce House Museum" },
    { name:"Henrietta Marie", year:1700, owner:"London merchant consortium", route:"London → West Africa → Jamaica", cargo:"190–200 enslaved Africans", incident:"Sank on its return voyage in 1700. Found by divers in 1972 — the most complete slave ship ever recovered. Now a memorial site in the Florida Keys.", source:"Mel Fisher Maritime Museum — Key West, FL" },
    { name:"Amistad", year:1839, owner:"José Ruiz & Pedro Montez", route:"Havana → Puerto Príncipe, Cuba", cargo:"53 enslaved Africans from Sierra Leone", incident:"Captives led by Sengbe Pieh seized the ship. US Supreme Court ruled them free in 1841. Became a landmark case in the abolitionist movement.", source:"United States v. The Amistad, 40 U.S. 518 (1841)" },
    { name:"Clotilda", year:1860, owner:"Timothy Meaher (Alabama)", route:"Ouidah, Benin → Mobile, Alabama", cargo:"110 enslaved Africans", incident:"The LAST slave ship to bring enslaved Africans to the United States — 52 years after the trade was made illegal. Meaher never faced justice. Survivors founded Africatown, Alabama.", source:"Smithsonian Magazine, 2019 — wreck confirmed by archaeologists" },
  ],
  companies: [
    { name:"Royal African Company", founded:1660, founders:"Duke of York (King James II), Charles II", hq:"London, England", enslaved:"100,000+", profit:"Monopoly on all English slave trade 1672–1698", modern:"Dissolved 1752. Wealth seeded City of London banking families.", source:"UCL Legacies of British Slave-ownership Database" },
    { name:"Dutch West India Company", founded:1621, founders:"Dutch Republic (States General)", hq:"Amsterdam, Netherlands", enslaved:"500,000+", profit:"Controlled Atlantic slave trade for most of 17th century", modern:"Dissolved 1791. Amsterdam's wealth directly traced to slave trade profits.", source:"Dutch National Archives — DWIC records" },
    { name:"Compagnie des Indes", founded:1664, founders:"Louis XIV of France / Jean Talon", hq:"Paris, France", enslaved:"1,000,000+", profit:"Supplied all French Caribbean colonies with enslaved Africans", modern:"Dissolved 1794. Families enriched include ancestors of modern French aristocracy.", source:"Archives nationales d'outre-mer, Aix-en-Provence" },
    { name:"South Sea Company", founded:1711, founders:"British government / Robert Harley", hq:"London, England", enslaved:"Contract for 4,800/year to Spanish Americas", profit:"The South Sea Bubble (1720) was partly driven by slave trade speculation", modern:"Its collapse ruined thousands of British investors. Slave trade speculation caused the first major financial crisis.", source:"Bank of England Archive; House of Commons Journal" },
  ],
  families: [
    { name:"Gladstone Family", country:"UK", enslaved:"2,508 people across 9 plantations", location:"Demerara & Jamaica", compensation:"£106,769 (≈ £83M today) paid to family upon abolition", connection:"William Gladstone, British Prime Minister 1868–1894, was son of slave-owner John Gladstone.", modern:"The Gladstone family received more compensation for their 'property' than any other British family.", source:"UCL Slave Ownership Database, T71/885" },
    { name:"Lascelles/Harewood Family", country:"UK", enslaved:"2,648 people, 47 plantations", location:"Barbados primarily", compensation:"£26,309 upon abolition", connection:"Ancestors of Diana, Princess of Wales. Harewood House in Yorkshire was built with slave trade wealth.", modern:"Harewood House publicly acknowledged its slave trade origins in 2020.", source:"UCL Database; Harewood House Trust statement 2020" },
    { name:"Brown Family (Brown University)", country:"USA", enslaved:"Captain James Brown transported hundreds across the Middle Passage", location:"Rhode Island / West Africa", compensation:"N/A (pre-abolition wealth)", connection:"Nicholas Brown Jr. donated to the college that bears the family name.", modern:"Brown University issued a 2006 report acknowledging its founding family's role in the slave trade.", source:"Brown University Steering Committee Report, 2006" },
    { name:"DeWolf Family", country:"USA", enslaved:"10,000+ over 3 generations", location:"Bristol, Rhode Island", compensation:"None — largest slave-trading family in US history", connection:"James DeWolf became a US Senator. Family members are alive today and have publicly acknowledged the history.", modern:"The documentary 'Traces of the Trade' (2008) follows DeWolf descendants reckoning with this history.", source:"Traces of the Trade documentary; Bristol Historical Society" },
  ],
  institutions: [
    { name:"Lloyd's of London", type:"Insurance", founded:1688, role:"Insured enslaved people as livestock/cargo — the financial backbone of the trade", modern:"Still exists. One of world's largest insurance markets.", acknowledged:true, source:"Lloyd's public statement, June 2020" },
    { name:"Barclays Bank", type:"Banking", founded:1736, role:"Founded by Quaker families (Barclays, Freame) who profited from slave trade financing", modern:"FTSE 100 bank. Net assets > £1 trillion.", acknowledged:false, source:"Barclays Group Archives; Prof. Nick Draper, UCL" },
    { name:"HSBC", type:"Banking", founded:1865, role:"Predecessor banks (Midland Bank) financed slave-worked cotton plantations in the American South", modern:"One of world's largest banks. Assets > $3 trillion.", acknowledged:false, source:"HSBC Group History; Cotton trade financing records" },
    { name:"Harvard University", type:"Education", founded:1636, role:"Founders and early donors were slave traders and slave owners. Enslaved people worked on campus.", modern:"$50bn+ endowment. Report published 2022: 'Harvard & the Legacy of Slavery'.", acknowledged:true, source:"Harvard & the Legacy of Slavery Report, 2022" },
    { name:"Yale University", type:"Education", founded:1701, role:"Named after Elihu Yale — a slave trader and Governor of the East India Company.", modern:"$40bn+ endowment.", acknowledged:true, source:"Yale & Slavery Research Project, 2020" },
  ],
};

// ── SECTIONS NAV ──────────────────────────────────────────────
const SECTIONS = [
  { id:"home",        label:"Home",        icon:"home",    colorKey:"accent" },
  { id:"explore",     label:"Explore",     icon:"globe",   colorKey:"info",    tagline:"The Interactive Globe",  status:"active" },
  { id:"timeline",    label:"Timeline",    icon:"clock",   colorKey:"accent",  tagline:"300,000 BCE → Present",  status:"active" },
  { id:"learn",       label:"Learn",       icon:"book",    colorKey:"info",    tagline:"People & Civilizations", status:"active" },
  { id:"reckon",      label:"Reckon",      icon:"scale",   colorKey:"reckon",  tagline:"Truth & Accountability", status:"active" },
  { id:"investigate", label:"Investigate", icon:"connect", colorKey:"slate",   tagline:"The PI Board",           status:"active" },
  { id:"research",    label:"Research",    icon:"ai",      colorKey:"success", tagline:"AI Research Suite",      status:"active" },
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
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={st}>{P[n]}</svg>;
}

function colOf(T, key) {
  return ({accent:T.accent,info:T.info,success:T.success,slate:T.slate,reckon:T.danger})[key]||T.accent;
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
          {[["#FFD700","Ancient"],["#E03030","Slave Trade"],["#4CAF7D","Modern"]].map(([c,l])=>(
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
  const img = useWikiImage(loc.wikiTitle);
  const meta = TYPE_META[loc.type];
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
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:7,fontWeight:600}}>Key Facts</div>
        {loc.facts.map((f,i)=>(
          <div key={i} style={{display:"flex",gap:7,marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:meta.color,flexShrink:0,marginTop:4}}/>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.6}}>{f}</span>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button style={{flex:1,padding:"7px",background:T.accent,border:"none",borderRadius:7,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em"}}>Open in Learn</button>
          <a href={`https://en.wikipedia.org/wiki/${loc.wikiTitle}`} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:"7px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <Ic n="extlink" s={10} c="currentColor" sw={2}/> Wikipedia
          </a>
        </div>
      </div>
    </div>
  );
}

// ── EXPLORE SECTION ───────────────────────────────────────────
function ExploreSection({ T, theme }) {
  const [selected, setSelected]   = useState(null);
  const [filterType,setFilterType]= useState("all");
  const [showArcs,  setShowArcs]  = useState(true);
  const [eraIdx,    setEraIdx]    = useState(ERAS.length-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef(null);
  const era = ERAS[eraIdx];

  const fmtY=y=>{if(y<=-100000)return`${(Math.abs(y)/1000).toFixed(0)}k BCE`;if(y<0)return`${Math.abs(y).toLocaleString()} BCE`;if(y>=2024)return"Present";return`${y} CE`;};
  const visLocs=useMemo(()=>LOCATIONS.filter(l=>l.startYear<=era.year&&(filterType==="all"||l.type===filterType)),[era.year,filterType]);
  const visArcs=useMemo(()=>showArcs?MIGRATIONS.filter(m=>m.startYear<=era.year):[],[era.year,showArcs]);
  const handleClick=useCallback(loc=>setSelected(s=>s?.id===loc.id?null:loc),[]);

  useEffect(()=>{
    if(isPlaying){playRef.current=setTimeout(()=>{if(eraIdx<ERAS.length-1)setEraIdx(i=>i+1);else setIsPlaying(false);},2200);}
    return()=>clearTimeout(playRef.current);
  },[isPlaying,eraIdx]);

  const sp=(eraIdx/(ERAS.length-1))*100;

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"7px 14px",display:"flex",alignItems:"center",gap:6,flexShrink:0,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkLight,fontWeight:600}}>Type</span>
        {[["all","All"],["origin","Origins"],["civilization","Civilizations"],["indigenous","Indigenous"],["diaspora","Diaspora"],["accountability","Accountability"]].map(([v,l])=>{
          const ac=v==="all"?T.accent:TYPE_META[v]?.color||T.accent,on=filterType===v;
          return <div key={v} onClick={()=>setFilterType(v)} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${on?ac+"60":T.border}`,background:on?ac+"18":"transparent",color:on?ac:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:on?600:400,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>{l}</div>;
        })}
        <div style={{width:1,height:16,background:T.border,margin:"0 2px"}}/>
        <div onClick={()=>setShowArcs(v=>!v)} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${showArcs?"rgba(76,175,125,0.5)":T.border}`,background:showArcs?"rgba(76,175,125,0.12)":"transparent",color:showArcs?"#4CAF7D":T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:9,textTransform:"uppercase",fontWeight:600,cursor:"pointer"}}>Arcs {showArcs?"On":"Off"}</div>
        <div style={{flex:1}}/>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight}}><span style={{color:T.accent,fontWeight:700}}>{visLocs.length}</span> locations</span>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,overflow:"hidden"}}><GlobeView visibleLocs={visLocs} visibleArcs={visArcs} onLocClick={handleClick} selected={selected} theme={theme}/></div>
        {selected&&<DetailPanel loc={selected} T={T} onClose={()=>setSelected(null)}/>}
      </div>
      <div style={{background:T.surface,borderTop:`1px solid ${T.border}`,padding:"10px 18px 12px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkLight,fontWeight:600}}>Time</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.accent}}>{fmtY(era.year)}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid}}>— {era.label}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>· {visLocs.length} locations</span>
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
          {["315k BCE","Out of Africa","First Kingdoms","Islamic Age","Slave Trade","Independence","Present"].map((l,i)=>(
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
  const [filterType, setFilterType] = useState("all");
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState("");

  const filtered = useMemo(()=>TIMELINE_EVENTS.filter(e=>
    (filterEra==="all"||e.era===filterEra)&&
    (filterType==="all"||e.type===filterType)&&
    (search===""||e.title.toLowerCase().includes(search.toLowerCase())||e.desc.toLowerCase().includes(search.toLowerCase()))
  ),[filterEra,filterType,search]);

  const fmtY=y=>{if(y<=-100000)return`${(Math.abs(y)/1000).toFixed(0)}k BCE`;if(y<0)return`${Math.abs(y).toLocaleString()} BCE`;if(y>=2024)return"Present";return`${y} CE`;};

  const eraColors={origins:"#FFD700",spread:"#FFC200",outafrica:"#45D4D4",neolithic:"#4CAF7D",firstkings:"#FF8C00",classical:"#FF5722",medieval:"#009AD8",empires:"#9B59B6",contact:"#E67E22",slavetrade:"#E03030",colonial:"#8B3030",independence:"#4CAF7D",present:"#009AD8"};

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>
      {/* Filter bar */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"8px 16px",display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,minWidth:200}}>
          <Ic n="search" s={13} c={T.inkLight}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events…" style={{border:"none",background:"transparent",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,flex:1,caretColor:T.accent}} />
        </div>
        <div style={{width:1,height:16,background:T.border}}/>
        {[["all","All Eras"],...ERAS.slice(0,7).map(e=>[e.id,e.label])].map(([v,l])=>{
          const on=filterEra===v;
          return <div key={v} onClick={()=>setFilterEra(v)} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${on?T.accent+"60":T.border}`,background:on?T.accentDim:"transparent",color:on?T.accent:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:on?600:400,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</div>;
        })}
        <div style={{flex:1}}/>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight}}><span style={{color:T.accent,fontWeight:700}}>{filtered.length}</span> events</span>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Event list */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          <div style={{position:"relative"}}>
            {/* Timeline line */}
            <div style={{position:"absolute",left:16,top:0,bottom:0,width:2,background:T.border}}/>
            {filtered.map((ev,i)=>{
              const col=eraColors[ev.era]||T.accent;
              const isSel=selected?.year===ev.year&&selected?.title===ev.title;
              return (
                <div key={i} onClick={()=>setSelected(isSel?null:ev)} style={{position:"relative",paddingLeft:44,marginBottom:20,cursor:"pointer"}}>
                  {/* Dot */}
                  <div style={{position:"absolute",left:8,top:6,width:18,height:18,borderRadius:"50%",background:isSel?col:T.card,border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",boxShadow:isSel?`0 0 10px ${col}60`:"none"}}>
                    {isSel&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
                  </div>
                  <div style={{background:isSel?T.cardHov:T.card,border:`1px solid ${isSel?col+"50":T.border}`,borderRadius:10,padding:"14px 16px",transition:"all 0.2s",boxShadow:isSel?`0 4px 16px rgba(0,0,0,0.15)`:"none"}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:6}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,color:col,letterSpacing:"0.04em"}}>{fmtY(ev.year)}</span>
                          <div style={{padding:"1px 7px",borderRadius:20,background:col+"20",border:`1px solid ${col}40`}}>
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:col,letterSpacing:"0.08em",textTransform:"uppercase"}}>{ev.region}</span>
                          </div>
                        </div>
                        <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:700,color:T.ink,margin:0,lineHeight:1.2}}>{ev.title}</h3>
                      </div>
                    </div>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,lineHeight:1.7,margin:"0 0 8px"}}>{ev.desc}</p>
                    {isSel&&(
                      <div style={{paddingTop:10,borderTop:`1px solid ${T.border}`,marginTop:4}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:6,fontWeight:600}}>Historical Impact</div>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:col,lineHeight:1.7,margin:0,fontStyle:"italic"}}>{ev.impact}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Era sidebar */}
        <div style={{width:200,borderLeft:`1px solid ${T.border}`,overflowY:"auto",background:T.surface,flexShrink:0}}>
          <div style={{padding:"14px 14px 8px",fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600}}>Eras</div>
          {ERAS.map(era=>{
            const on=filterEra===era.id;
            const col=eraColors[era.id]||T.accent;
            const count=TIMELINE_EVENTS.filter(e=>e.era===era.id).length;
            return (
              <div key={era.id} onClick={()=>setFilterEra(on?"all":era.id)} style={{padding:"10px 14px",cursor:"pointer",background:on?col+"18":"transparent",borderLeft:on?`3px solid ${col}`:"3px solid transparent",transition:"all 0.15s"}}
                onMouseEnter={e=>{if(!on)e.currentTarget.style.background=T.card;}}
                onMouseLeave={e=>{if(!on)e.currentTarget.style.background="transparent";}}
              >
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:on?600:400,color:on?col:T.inkMid}}>{era.label}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,marginTop:2}}>{count} events</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── LEARN SECTION ─────────────────────────────────────────────
function LearnSection({ T }) {
  const [tab,   setTab]   = useState("people");
  const [search,setSearch]= useState("");
  const [sel,   setSel]   = useState(null);

  const filtered = useMemo(()=>{
    const src=tab==="people"?PEOPLE:LOCATIONS.filter(l=>l.type==="civilization");
    return src.filter(item=>item.name.toLowerCase().includes(search.toLowerCase())||(item.role||item.era||"").toLowerCase().includes(search.toLowerCase()));
  },[tab,search]);

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>
      {/* Tabs + search */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        {[["people","People & Figures"],["civilizations","Civilizations"],["contributions","Contributions"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{padding:"12px 4px",background:"transparent",border:"none",borderBottom:tab===v?`2px solid ${T.accent}`:"2px solid transparent",color:tab===v?T.accent:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:tab===v?600:400,cursor:"pointer",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>{l}</button>
        ))}
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,minWidth:180}}>
          <Ic n="search" s={13} c={T.inkLight}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{border:"none",background:"transparent",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,flex:1,caretColor:T.accent}}/>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {tab==="contributions"
          ? <ContributionsTab T={T}/>
          : <>
              <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
                  {filtered.map(item=>(
                    <PersonCard key={item.id} item={item} tab={tab} T={T} selected={sel?.id===item.id} onClick={()=>setSel(s=>s?.id===item.id?null:item)}/>
                  ))}
                </div>
              </div>
              {sel&&<LearnDetailPanel item={sel} tab={tab} T={T} onClose={()=>setSel(null)}/>}
            </>
        }
      </div>
    </div>
  );
}

function PersonCard({ item, tab, T, selected, onClick }) {
  const img = useWikiImage(item.wikiTitle);
  const color = tab==="people" ? T.info : T.accent;
  return (
    <div onClick={onClick} style={{background:selected?T.cardHov:T.card,border:`1px solid ${selected?color+"50":T.border}`,borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",transform:selected?"translateY(-2px)":"none",boxShadow:selected?`0 6px 20px rgba(0,0,0,0.15)`:"none"}}>
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

function ContributionsTab({ T }) {
  const contribs = [
    { cat:"Mathematics", icon:"📐", items:["Egyptian Rhind Papyrus (1550 BCE): earliest algebra and geometry","Timbuktu scholars: advanced astronomical calculations","Binary number system concepts traced to West African counting systems","Architecture of the pyramids required pi, trigonometry, and surveying"] },
    { cat:"Medicine", icon:"🏥", items:["Ebers Papyrus (1550 BCE): 700 medical treatments — world's oldest medical text","Edwin Smith Papyrus: first surgical text — described brain, spinal cord, nervous system","Imhotep (2650 BCE): first named physician in history — later deified","Ancient Nubians: tetracycline found in bones, suggesting antibiotic brewing"] },
    { cat:"Music & Culture", icon:"🎵", items:["Jazz, Blues, Gospel, Rock & Roll, R&B, Hip-Hop all trace to African roots","Polyrhythmic drumming: foundational to all popular music on Earth","Griots: West African oral historians who preserved history for millennia","Vodou, Candomblé, Santería: African religions that survived slavery intact"] },
    { cat:"Architecture", icon:"🏛️", items:["The Great Pyramid (2560 BCE): tallest structure on Earth for 3,800 years","Nubian pyramids: 200+ still standing at Meroë, Sudan","Great Zimbabwe: unmortared stone structures covering 720 hectares","Timbuktu mosques: Djinguereber Mosque built 1327 CE, still standing"] },
    { cat:"Language & Writing", icon:"📜", items:["Hieroglyphs (3200 BCE): among world's earliest writing systems","Meroitic script: independently developed in Sudan, not derived from Egyptian","Ge'ez script (Ethiopia): still in use today — one of oldest living alphabets","Swahili: lingua franca of East Africa, spoken by 200 million people today"] },
    { cat:"Philosophy & Religion", icon:"🌟", items:["Ma'at (Egyptian): concept of truth, justice, cosmic balance — predates Greek philosophy","Ifa oracle (Yoruba): recognised by UNESCO as Intangible Cultural Heritage","Christianity: born in Jewish-African context; Ethiopia adopted it before Rome","Islam in Africa: independent intellectual tradition producing 700,000+ manuscripts"] },
    { cat:"Science & Innovation", icon:"🔬", items:["Iron-smelting: independently invented in sub-Saharan Africa before Iron Age Europe","Astronomy: Dogon people (Mali) described Sirius B before European telescopes could see it","Traditional ecological knowledge: Hadza and forest peoples outperform Western pharmacology","Modern agriculture: sorghum, coffee, millet, okra — all domesticated in Africa"] },
    { cat:"Politics & Law", icon:"⚖️", items:["Ubuntu philosophy: 'I am because we are' — foundational to restorative justice movements","Gada system (Oromo, Ethiopia): democratic governance system 500+ years old","Maroon societies: self-governing free communities across the Americas","African Union (1963–): continental governance body representing 1.4 billion people"] },
  ];
  return (
    <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
        {contribs.map((c,i)=>(
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

// ── RECKON SECTION ────────────────────────────────────────────
function ReckonSection({ T }) {
  const [tab,  setTab]  = useState("ships");
  const [sel,  setSel]  = useState(null);

  const tabs=[["ships","Slave Ships"],["companies","Companies"],["families","Families"],["institutions","Institutions"]];
  const data={ships:ACCOUNTABILITY.ships,companies:ACCOUNTABILITY.companies,families:ACCOUNTABILITY.families,institutions:ACCOUNTABILITY.institutions};
  const items=data[tab]||[];

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"12px 16px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
          <div style={{padding:"6px 10px",background:T.danger+"20",border:`1px solid ${T.danger}40`,borderRadius:6}}>
            <Ic n="warning" s={14} c={T.danger}/>
          </div>
          <div>
            <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:T.ink,margin:"0 0 3px"}}>Truth & Accountability</h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,margin:0}}>Named individuals, companies, and institutions. Every entry is sourced. Nothing here is opinion.</p>
          </div>
        </div>
        <div style={{display:"flex",gap:0}}>
          {tabs.map(([v,l])=>(
            <button key={v} onClick={()=>{setTab(v);setSel(null);}} style={{padding:"8px 16px",background:"transparent",border:"none",borderBottom:tab===v?`2px solid ${T.danger}`:"2px solid transparent",color:tab===v?T.danger:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:tab===v?600:400,cursor:"pointer",letterSpacing:"0.04em"}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          {items.map((item,i)=>{
            const isSel=sel===i;
            return (
              <div key={i} onClick={()=>setSel(isSel?null:i)} style={{background:isSel?T.cardHov:T.card,border:`1px solid ${isSel?T.danger+"50":T.border}`,borderRadius:10,padding:"16px 18px",marginBottom:12,cursor:"pointer",transition:"all 0.2s",borderLeft:isSel?`3px solid ${T.danger}`:"3px solid transparent"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:700,color:T.ink,margin:"0 0 3px"}}>{item.name}</h3>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {item.year&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.accent}}>{item.year}</span>}
                      {item.founded&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.accent}}>Founded {item.founded}</span>}
                      {item.country&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>{item.country}</span>}
                      {item.type&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.info}}>{item.type}</span>}
                    </div>
                  </div>
                  {item.acknowledged!==undefined&&<div style={{padding:"2px 8px",borderRadius:20,background:item.acknowledged?"rgba(76,175,125,0.15)":"rgba(224,48,48,0.15)",border:`1px solid ${item.acknowledged?"rgba(76,175,125,0.4)":"rgba(224,48,48,0.4)"}`,fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,letterSpacing:"0.06em",color:item.acknowledged?"#4CAF7D":T.danger,whiteSpace:"nowrap"}}>
                    {item.acknowledged?"Acknowledged":"Not Acknowledged"}
                  </div>}
                </div>

                {tab==="ships"&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {[["Owner",item.owner],["Route",item.route],["Cargo",item.cargo]].map(([k,v])=>(
                    <div key={k}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{k}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid}}>{v}</div></div>
                  ))}
                </div></>}

                {tab==="companies"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {[["Founders",item.founders],["HQ",item.hq],["Enslaved",item.enslaved],["Legacy",item.modern]].map(([k,v])=>(
                    <div key={k}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{k}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid}}>{v}</div></div>
                  ))}
                </div>}

                {tab==="families"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {[["Enslaved",item.enslaved],["Location",item.location],["Compensation",item.compensation]].map(([k,v])=>(
                    <div key={k}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{k}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid}}>{v}</div></div>
                  ))}
                </div>}

                {isSel&&<>
                  <div style={{paddingTop:10,borderTop:`1px solid ${T.border}`,marginTop:4}}>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,lineHeight:1.75,margin:"0 0 8px"}}>{item.incident||item.role||item.connection}</p>
                    {item.modern&&tab!=="companies"&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,lineHeight:1.75,margin:"0 0 8px",fontStyle:"italic"}}>{item.modern}</p>}
                    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:T.surface,borderRadius:6,border:`1px solid ${T.border}`}}>
                      <Ic n="extlink" s={11} c={T.inkLight}/>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight}}>{item.source}</span>
                    </div>
                  </div>
                </>}
              </div>
            );
          })}
        </div>

        {/* Sidebar info */}
        <div style={{width:240,borderLeft:`1px solid ${T.border}`,background:T.surface,padding:"16px",overflowY:"auto",flexShrink:0}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:12,fontWeight:600}}>Sources</div>
          {[
            {name:"UCL Legacies of British Slave-ownership",url:"https://www.ucl.ac.uk/lbs/"},
            {name:"SlaveVoyages.org — 36,000+ documented voyages",url:"https://www.slavevoyages.org/"},
            {name:"National Archives UK — slave trade records",url:"https://www.nationalarchives.gov.uk/"},
            {name:"Trans-Atlantic Slave Trade Database",url:"https://www.slavevoyages.org/"},
          ].map((s,i)=>(
            <div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${T.border}`}}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.info,lineHeight:1.55,textDecoration:"none"}}>{s.name}</a>
            </div>
          ))}
          <div style={{marginTop:12,padding:"12px",background:T.danger+"10",border:`1px solid ${T.danger}25`,borderRadius:8}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.danger,fontWeight:600,marginBottom:6}}>A Note on This Data</div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,lineHeight:1.65,margin:0}}>Every entry here is sourced to public records, academic databases, or institutional acknowledgements. This is not accusation — it is documented history.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── INVESTIGATE (PI BOARD) ────────────────────────────────────
const NODE_TYPES = {
  person:      { icon:"👤", color:"#009AD8", label:"Person"      },
  place:       { icon:"🏛️", color:"#E05A2B", label:"Place"       },
  event:       { icon:"⚡", color:"#9B59B6", label:"Event"       },
  institution: { icon:"📖", color:"#4CAF7D", label:"Institution" },
  trade:       { icon:"🐪", color:"#E6A817", label:"Trade"       },
  ship:        { icon:"⚓", color:"#E03030", label:"Ship"        },
  document:    { icon:"📜", color:"#708090", label:"Document"    },
};

const RELATION_LABELS = [
  "Visited","Patronized","Founded","Traded with","Funded",
  "Conquered","Enslaved","Insured","Connected to","Led","Built",
  "Looted","Colonized","Resisted","Influenced",
];

const DEFAULT_NODES = [
  { id:1, label:"Mansa Musa",         type:"person",      x:220, y:160 },
  { id:2, label:"Mali Empire",        type:"place",       x:500, y:200 },
  { id:3, label:"Sankore University", type:"institution", x:760, y:130 },
  { id:4, label:"Trans-Saharan Trade",type:"trade",       x:160, y:380 },
  { id:5, label:"Timbuktu",           type:"place",       x:500, y:380 },
];

const DEFAULT_EDGES = [
  { id:1, from:1, to:2, label:"Ruled"      },
  { id:2, from:2, to:3, label:"Patronized" },
  { id:3, from:1, to:5, label:"Visited"    },
  { id:4, from:4, to:2, label:"Funded"     },
  { id:5, from:5, to:3, label:"Hosted"     },
];

function InvestigateSection({ T, nodes: propNodes, edges: propEdges, setNodes: setPropNodes, setEdges: setPropEdges }) {
  const svgRef      = useRef(null);
  const [nodes,     setNodesLocal]  = useState(propNodes || DEFAULT_NODES);
  const [edges,     setEdgesLocal]  = useState(propEdges || DEFAULT_EDGES);

  // Sync with shared state if provided
  const setNodes = (val) => {
    setNodesLocal(val);
    if (setPropNodes) setPropNodes(val);
  };
  const setEdges = (val) => {
    setEdgesLocal(val);
    if (setPropEdges) setPropEdges(val);
  };

  // Sync in when props change (e.g. Research pushes new nodes)
  useEffect(() => {
    if (propNodes) setNodesLocal(propNodes);
  }, [propNodes]);
  useEffect(() => {
    if (propEdges) setEdgesLocal(propEdges);
  }, [propEdges]);
  const [dragging,  setDragging]  = useState(null);
  const [selNode,   setSelNode]   = useState(null);
  const [selEdge,   setSelEdge]   = useState(null);
  const [connecting,setConnecting]= useState(null); // node id we're connecting FROM
  const [newLabel,  setNewLabel]  = useState("");
  const [newType,   setNewType]   = useState("person");
  const [relLabel,  setRelLabel]  = useState("Connected to");
  const [layout,    setLayout]    = useState("free"); // free | radial | tree
  const [search,    setSearch]    = useState("");
  const [filterType,setFilterType]= useState("all");
  const dragOffset  = useRef({x:0,y:0});
  const nextId      = useRef(6);

  // ── Layout engines ────────────────────────────────────────────
  const applyLayout = (type) => {
    setLayout(type);
    const cx = 500, cy = 300, r = 220;
    if (type === "radial") {
      setNodes(prev => prev.map((n,i) => ({
        ...n,
        x: i===0 ? cx : cx + r * Math.cos((2*Math.PI*i)/prev.length - Math.PI/2),
        y: i===0 ? cy : cy + r * Math.sin((2*Math.PI*i)/prev.length - Math.PI/2),
      })));
    } else if (type === "tree") {
      setNodes(prev => prev.map((n,i) => ({
        ...n,
        x: 120 + (i % 4) * 220,
        y: 120 + Math.floor(i / 4) * 180,
      })));
    }
  };

  // ── Drag ──────────────────────────────────────────────────────
  const onNodeMouseDown = (e, id) => {
    e.stopPropagation();
    if (connecting !== null) {
      if (connecting !== id) {
        setEdges(prev => {
          const exists = prev.some(ed => (ed.from===connecting&&ed.to===id)||(ed.from===id&&ed.to===connecting));
          if (exists) return prev;
          return [...prev, { id: Date.now(), from: connecting, to: id, label: relLabel }];
        });
      }
      setConnecting(null);
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === id);
    dragOffset.current = { x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y };
    setDragging(id);
    setSelNode(id);
    setSelEdge(null);
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(70, Math.min(rect.width - 70, e.clientX - rect.left - dragOffset.current.x));
    const y = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top - dragOffset.current.y));
    setNodes(prev => prev.map(n => n.id === dragging ? {...n, x, y} : n));
  };

  const addNode = () => {
    if (!newLabel.trim()) return;
    setNodes(prev => [...prev, { id: nextId.current++, label: newLabel.trim(), type: newType, x: 300 + Math.random()*200, y: 150 + Math.random()*200 }]);
    setNewLabel("");
  };

  const deleteNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    setSelNode(null);
  };

  const deleteEdge = (id) => {
    setEdges(prev => prev.filter(e => e.id !== id));
    setSelEdge(null);
  };

  // ── Filtered nodes ────────────────────────────────────────────
  const visNodes = nodes.filter(n =>
    (filterType === "all" || n.type === filterType) &&
    (search === "" || n.label.toLowerCase().includes(search.toLowerCase()))
  );
  const visNodeIds = new Set(visNodes.map(n => n.id));
  const visEdges = edges.filter(e => visNodeIds.has(e.from) && visNodeIds.has(e.to));

  const selNodeData = nodes.find(n => n.id === selNode);
  const selEdgeData = edges.find(e => e.id === selEdge);

  // ── Arrow path between two nodes ─────────────────────────────
  const edgePath = (edge) => {
    const f = nodes.find(n => n.id === edge.from);
    const t = nodes.find(n => n.id === edge.to);
    if (!f || !t) return null;
    const dx = t.x - f.x, dy = t.y - f.y;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const nx = dx/len, ny = dy/len;
    // Offset start/end by node half-width (approx 70px)
    const sx = f.x + nx*72, sy = f.y + ny*22;
    const ex = t.x - nx*72, ey = t.y - ny*22;
    // Slight curve
    const mx = (sx+ex)/2 - ny*30, my = (sy+ey)/2 + nx*30;
    return { path:`M${sx},${sy} Q${mx},${my} ${ex},${ey}`, mx, my };
  };

  const isDark = T.name === "dark";

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>
      <style>{`
        @keyframes dash-flow { to { stroke-dashoffset: -20; } }
        @keyframes node-pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
      `}</style>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
        {/* Add node */}
        <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNode()}
          placeholder="Node label…"
          style={{padding:"6px 10px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,outline:"none",width:150,caretColor:T.accent}} />
        <select value={newType} onChange={e=>setNewType(e.target.value)}
          style={{padding:"6px 8px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.inkMid,outline:"none",cursor:"pointer"}}>
          {Object.entries(NODE_TYPES).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <button onClick={addNode}
          style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",background:T.accent,border:"none",borderRadius:7,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
          <Ic n="plus" s={13} c="#fff"/> New Node
        </button>

        <div style={{width:1,height:20,background:T.border}}/>

        {/* Relation label */}
        <select value={relLabel} onChange={e=>setRelLabel(e.target.value)}
          style={{padding:"6px 8px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid,outline:"none",cursor:"pointer"}}>
          {RELATION_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <button onClick={()=>setConnecting(c=>c!==null?null:-1)}
          style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",background:connecting!==null?T.info+"25":"transparent",border:`1px solid ${connecting!==null?T.info:T.border}`,borderRadius:7,color:connecting!==null?T.info:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:connecting!==null?700:400,cursor:"pointer",transition:"all 0.2s"}}>
          <Ic n="link" s={13} c="currentColor"/> {connecting!==null?"Click target…":"Connect & Relate"}
        </button>

        <div style={{width:1,height:20,background:T.border}}/>

        {/* Quick filters */}
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,letterSpacing:"0.06em",textTransform:"uppercase"}}>Filter:</span>
        {[["all","All"],...Object.entries(NODE_TYPES).slice(0,4).map(([k,v])=>[k,v.icon+" "+v.label])].map(([v,l]) => {
          const on = filterType===v;
          return <div key={v} onClick={()=>setFilterType(v)} style={{padding:"3px 9px",borderRadius:20,background:on?T.accent+"22":"transparent",border:`1px solid ${on?T.accent+"50":T.border}`,color:on?T.accent:T.inkLight,fontFamily:"'DM Sans',sans-serif",fontSize:10,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</div>;
        })}

        <div style={{width:1,height:20,background:T.border}}/>

        {/* Search */}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7}}>
          <Ic n="search" s={12} c={T.inkLight}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
            style={{border:"none",background:"transparent",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,width:100,caretColor:T.accent}}/>
        </div>

        <div style={{flex:1}}/>

        {/* Stats */}
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight}}>
          <span style={{color:T.accent,fontWeight:700}}>{visNodes.length}</span> nodes ·{" "}
          <span style={{color:T.info,fontWeight:700}}>{visEdges.length}</span> connections
        </span>

        {/* Layout views */}
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,marginRight:4}}>Layout:</span>
          {[
            {id:"free",   icon:"⊙", tip:"Free drag"},
            {id:"radial", icon:"◎", tip:"Radial"},
            {id:"tree",   icon:"⊞", tip:"Grid"},
          ].map(lv => (
            <button key={lv.id} onClick={()=>applyLayout(lv.id)} title={lv.tip}
              style={{width:24,height:24,borderRadius:5,border:`1px solid ${layout===lv.id?T.accent:T.border}`,background:layout===lv.id?T.accent+"22":"transparent",color:layout===lv.id?T.accent:T.inkLight,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {lv.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas + sidebar ──────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* SVG canvas */}
        <svg ref={svgRef}
          style={{flex:1,background:isDark?"#0C0B08":"#F5F3EE",cursor:dragging?"grabbing":connecting!==null?"crosshair":"default",overflow:"hidden"}}
          onMouseMove={onMouseMove} onMouseUp={()=>setDragging(null)}
          onClick={e=>{if(e.target===svgRef.current){setSelNode(null);setSelEdge(null);}}}>

          {/* Grid */}
          <defs>
            <pattern id="pi-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0L0 0 0 32" fill="none" stroke={isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)"} strokeWidth="0.7"/>
            </pattern>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={isDark?"rgba(255,255,255,0.25)":"rgba(0,0,0,0.25)"}/>
            </marker>
            <marker id="arrowhead-sel" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={T.accent}/>
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#pi-grid)"/>

          {/* ── Edges ──────────────────────────────────────────── */}
          {visEdges.map(edge => {
            const ep = edgePath(edge);
            if (!ep) return null;
            const isSel = selEdge === edge.id;
            const fromNode = nodes.find(n=>n.id===edge.from);
            const edgeColor = isSel ? T.accent : fromNode ? NODE_TYPES[fromNode.type]?.color+"80" : isDark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.2)";
            return (
              <g key={edge.id} onClick={e=>{e.stopPropagation();setSelEdge(isSel?null:edge.id);setSelNode(null);}}>
                {/* Wider invisible hit area */}
                <path d={ep.path} fill="none" stroke="transparent" strokeWidth="12" style={{cursor:"pointer"}}/>
                {/* Visible edge */}
                <path d={ep.path} fill="none"
                  stroke={edgeColor} strokeWidth={isSel?2:1.5}
                  strokeDasharray={isSel?"none":"6 3"}
                  style={isSel?{}:{animation:"dash-flow 1s linear infinite"}}
                  markerEnd={isSel?"url(#arrowhead-sel)":"url(#arrowhead)"}/>
                {/* Relation label */}
                <rect x={ep.mx-28} y={ep.my-9} width={56} height={18} rx={9}
                  fill={isDark?"rgba(20,18,16,0.85)":"rgba(245,243,238,0.92)"}
                  stroke={isSel?T.accent:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)"} strokeWidth={isSel?1.5:1}/>
                <text x={ep.mx} y={ep.my+4} textAnchor="middle"
                  style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fill:isSel?T.accent:isDark?"rgba(255,255,255,0.55)":"rgba(0,0,0,0.5)",pointerEvents:"none",letterSpacing:"0.04em"}}>
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* ── Nodes ──────────────────────────────────────────── */}
          {visNodes.map(node => {
            const meta    = NODE_TYPES[node.type] || NODE_TYPES.person;
            const isSel   = selNode === node.id;
            const isFrom  = connecting === node.id;
            const W=130, H=42, rx=10;
            return (
              <g key={node.id}
                transform={`translate(${node.x - W/2}, ${node.y - H/2})`}
                onMouseDown={e=>onNodeMouseDown(e, node.id)}
                style={{cursor:dragging===node.id?"grabbing":"grab"}}>

                {/* Selection glow */}
                {(isSel||isFrom) && (
                  <rect x={-3} y={-3} width={W+6} height={H+6} rx={rx+3}
                    fill="none" stroke={isFrom?T.info:meta.color} strokeWidth="2" opacity="0.5"
                    style={isFrom?{animation:"node-pulse 1.2s ease-in-out infinite"}:{}}/>
                )}

                {/* Card background */}
                <rect width={W} height={H} rx={rx}
                  fill={isDark?`${meta.color}18`:`${meta.color}12`}
                  stroke={meta.color} strokeWidth={isSel?2:1.5}/>

                {/* Icon box */}
                <rect x={0} y={0} width={38} height={H} rx={rx}
                  fill={`${meta.color}30`}/>
                <text x={19} y={H/2+6} textAnchor="middle"
                  style={{fontSize:16,pointerEvents:"none",userSelect:"none"}}>
                  {meta.icon}
                </text>

                {/* Divider */}
                <line x1={38} y1={6} x2={38} y2={H-6} stroke={`${meta.color}50`} strokeWidth="1"/>

                {/* Label */}
                <text x={W/2+19/2} y={H/2-3} textAnchor="middle"
                  style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,fill:isDark?"#FCF9F7":"#231E18",pointerEvents:"none",userSelect:"none"}}>
                  {node.label.length>14?node.label.slice(0,13)+"…":node.label}
                </text>
                {/* Type label */}
                <text x={W/2+19/2} y={H/2+10} textAnchor="middle"
                  style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fill:meta.color,pointerEvents:"none",userSelect:"none",letterSpacing:"0.06em",textTransform:"uppercase"}}>
                  {meta.label}
                </text>
              </g>
            );
          })}

          {/* "Connecting from" hint */}
          {connecting !== null && connecting !== -1 && (
            <text x="50%" y="96%" textAnchor="middle"
              style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fill:T.info,pointerEvents:"none"}}>
              Click any node to connect with "{relLabel}"  ·  Press Escape to cancel
            </text>
          )}
          {connecting === -1 && (
            <text x="50%" y="96%" textAnchor="middle"
              style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fill:T.info,pointerEvents:"none"}}>
              Click a source node first
            </text>
          )}
        </svg>

        {/* ── Detail sidebar ──────────────────────────────────────── */}
        <div style={{width:220,borderLeft:`1px solid ${T.border}`,background:T.surface,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
          {/* Node detail */}
          {selNodeData && (
            <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600}}>Selected Node</span>
                <button onClick={()=>setSelNode(null)} style={{background:"transparent",border:"none",color:T.inkLight,cursor:"pointer",fontSize:14,lineHeight:1}}>✕</button>
              </div>
              {/* Node card preview */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:NODE_TYPES[selNodeData.type]?.color+"18",border:`1.5px solid ${NODE_TYPES[selNodeData.type]?.color}`,borderRadius:10,marginBottom:12}}>
                <span style={{fontSize:20}}>{NODE_TYPES[selNodeData.type]?.icon}</span>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.ink}}>{selNodeData.label}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:NODE_TYPES[selNodeData.type]?.color,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{NODE_TYPES[selNodeData.type]?.label}</div>
                </div>
              </div>

              {/* Connections */}
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:8,fontWeight:600}}>Connections</div>
              {edges.filter(e=>e.from===selNodeData.id||e.to===selNodeData.id).length === 0
                ? <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkLight}}>No connections yet</p>
                : edges.filter(e=>e.from===selNodeData.id||e.to===selNodeData.id).map((edge,i) => {
                  const otherId = edge.from===selNodeData.id?edge.to:edge.from;
                  const other   = nodes.find(n=>n.id===otherId);
                  const dir     = edge.from===selNodeData.id?"→":"←";
                  if (!other) return null;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,marginBottom:6}}>
                      <span style={{fontSize:12}}>{NODE_TYPES[other.type]?.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:T.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{dir} {other.label}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkLight,fontStyle:"italic"}}>{edge.label}</div>
                      </div>
                    </div>
                  );
                })
              }

              {/* Actions */}
              <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:7}}>
                <button onClick={()=>{setConnecting(selNodeData.id);}}
                  style={{padding:"7px",background:T.info+"18",border:`1px solid ${T.info}40`,borderRadius:7,color:T.info,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em"}}>
                  🔗 Connect from here
                </button>
                <button onClick={()=>deleteNode(selNodeData.id)}
                  style={{padding:"7px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.danger,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  <Ic n="trash" s={12} c={T.danger}/> Delete node
                </button>
              </div>
            </div>
          )}

          {/* Edge detail */}
          {selEdgeData && !selNodeData && (
            <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600}}>Selected Edge</span>
                <button onClick={()=>setSelEdge(null)} style={{background:"transparent",border:"none",color:T.inkLight,cursor:"pointer",fontSize:14,lineHeight:1}}>✕</button>
              </div>
              {(() => {
                const f = nodes.find(n=>n.id===selEdgeData.from);
                const t = nodes.find(n=>n.id===selEdgeData.to);
                if (!f||!t) return null;
                return (
                  <>
                    <div style={{padding:"10px 12px",background:T.accentDim,border:`1px solid ${T.accent}30`,borderRadius:9,marginBottom:12,textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink,marginBottom:4}}>
                        <span style={{color:NODE_TYPES[f.type]?.color}}>{NODE_TYPES[f.type]?.icon} {f.label}</span>
                      </div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.accent,fontWeight:700,fontStyle:"italic",margin:"4px 0"}}>→ {selEdgeData.label} →</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink}}>
                        <span style={{color:NODE_TYPES[t.type]?.color}}>{NODE_TYPES[t.type]?.icon} {t.label}</span>
                      </div>
                    </div>
                    {/* Edit relation label */}
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,marginBottom:6,fontWeight:600}}>Relation</div>
                    <select value={selEdgeData.label}
                      onChange={e=>setEdges(prev=>prev.map(ed=>ed.id===selEdgeData.id?{...ed,label:e.target.value}:ed))}
                      style={{width:"100%",padding:"6px 8px",background:T.card,border:`1px solid ${T.border}`,borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink,outline:"none",marginBottom:10}}>
                      {RELATION_LABELS.map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
                    <button onClick={()=>deleteEdge(selEdgeData.id)}
                      style={{width:"100%",padding:"7px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.danger,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                      <Ic n="trash" s={12} c={T.danger}/> Delete edge
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {/* Default state */}
          {!selNodeData && !selEdgeData && (
            <div style={{flex:1,padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkFaint,fontWeight:600,marginBottom:4}}>Node Types</div>
              {Object.entries(NODE_TYPES).map(([k,v])=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:26,height:26,borderRadius:6,background:`${v.color}20`,border:`1.5px solid ${v.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{v.icon}</div>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.inkMid}}>{v.label}</span>
                </div>
              ))}
              <div style={{marginTop:8,padding:"10px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkFaint,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5,fontWeight:600}}>How to use</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.inkLight,lineHeight:1.6}}>
                  Drag nodes freely.<br/>
                  Click <strong style={{color:T.ink}}>Connect & Relate</strong> then click two nodes to draw an edge.<br/>
                  Click any node or edge to inspect.
                </div>
              </div>
            </div>
          )}
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
    {id:"explore",label:"Explore",icon:"globe",colorKey:"info",tagline:"The Interactive Globe",desc:"Navigate 300,000 years of African presence. Click locations, trace migration routes."},
    {id:"timeline",label:"Timeline",icon:"clock",colorKey:"accent",tagline:"300,000 BCE → Present",desc:"Every era, every turning point. Watch history unfold on the time slider."},
    {id:"learn",label:"Learn",icon:"book",colorKey:"info",tagline:"People & Civilizations",desc:"Kings, scholars, warriors, activists. Ancient empires. Every contribution Africa gave the world."},
    {id:"reckon",label:"Reckon",icon:"scale",colorKey:"reckon",tagline:"Truth & Accountability",desc:"Named ships, owners, companies. Looted artifacts. The living wealth trail."},
    {id:"investigate",label:"Investigate",icon:"connect",colorKey:"slate",tagline:"The PI Board",desc:"Drop nodes, draw connections, follow the thread across 300,000 years."},
    {id:"research",label:"Research",icon:"ai",colorKey:"success",tagline:"AI Research Suite",desc:"Four AI agents: The Historian, Investigator, Visualizer, Guide. Ask anything."},
  ];

  return (
    <div style={{height:"100%",overflowY:"auto",background:T.bg,transition:"background 0.3s"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"36px 40px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20,marginBottom:20}}>
          <div style={{...a(0),background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{height:190,background:heroBg,position:"relative",overflow:"hidden",padding:"24px 28px",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
              <div style={{position:"absolute",inset:0,opacity:0.06}}>{[0,1,2,3,4,5].map(i=><div key={i} style={{position:"absolute",borderRadius:"50%",border:`1px solid ${T.accent}`,width:160+i*80,height:160+i*80,top:"50%",left:"30%",transform:"translate(-50%,-50%)"}}/>)}</div>
              <div style={{position:"relative"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:T.accent,fontWeight:600,marginBottom:8}}>Current Dossier</div>
                <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,fontWeight:700,color:"#FCF9F7",lineHeight:1.1,margin:0}}>The Global<br/><em style={{color:T.accent}}>African Story</em></h1>
              </div>
            </div>
            <div style={{padding:"20px 24px",flex:1}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.inkMid,lineHeight:1.8,margin:"0 0 20px"}}>Investigate 300,000 years of African history. Trace civilizations, follow migration routes, name the architects of the slave trade, and discover how Africa shaped every corner of the modern world.</p>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>onNavigate("explore")} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",background:T.accent,border:"none",borderRadius:7,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em"}} onMouseEnter={e=>e.currentTarget.style.background=T.accentMid} onMouseLeave={e=>e.currentTarget.style.background=T.accent}>Begin Investigation <Ic n="arrowR" s={14} c="#fff"/></button>
                <button onClick={()=>onNavigate("research")} style={{padding:"10px 18px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.inkMid,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.inkLight;e.currentTarget.style.color=T.ink;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.inkMid;}}>Ask the AI →</button>
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{...a(0.08),background:T.name==="dark"?T.surface:T.ink,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(252,249,247,0.3)",marginBottom:18,fontWeight:600}}>Platform Scope</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {[{n:300000,suf:" BCE",label:"Years of History",d:100},{n:36000,suf:"+",label:"Slave Voyages",d:250},{n:1500,suf:"+",label:"Historical Figures",d:400},{n:54,suf:"",label:"African Nations",d:550}].map((s,i)=>(
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
              <PBar label="African Civilizations" pct={84} color={T.accent}  T={T} delay={0}/>
              <PBar label="Diaspora History"      pct={62} color={T.info}    T={T} delay={120}/>
              <PBar label="Colonial Records"      pct={78} color={T.danger}  T={T} delay={240}/>
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
            Named after <strong style={{color:T.ink,fontWeight:600}}>Septimius Severus</strong> — born in Leptis Magna, North Africa, 145 CE. Emperor of Rome, 193 CE. Africa has always been at the centre of civilisation.
          </p>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",color:T.inkFaint,textAlign:"right",flexShrink:0}}>Open Source<br/>All Sources Cited</div>
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
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.inkLight,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:1}}>History Platform · v1</div>
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
function TopBar({ active, onNavigate, onToggle, theme, onToggleTheme, T }) {
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
      <div style={{padding:"5px 14px",background:T.accentDim,border:`1px solid ${T.accent}35`,borderRadius:6,flexShrink:0}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.accent,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Phase 1 · Africa</span>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────
export default function App() {
  const [active,   setActive]   = useState("home");
  const [sideOpen, setSideOpen] = useState(true);
  const [theme,    setTheme]    = useState("dark");
  const T = theme==="dark" ? DARK : LIGHT;

  // ── Shared PI board state (lifted so Research can push to Investigate) ──
  const [piNodes,    setPiNodes]    = useState(DEFAULT_NODES);
  const [piEdges,    setPiEdges]    = useState(DEFAULT_EDGES);
  const [piNewCount, setPiNewCount] = useState(0); // badge counter

  const pushToBoard = (newNodes, newEdges) => {
    setPiNodes(prev => {
      const existingLabels = new Set(prev.map(n => n.label.toLowerCase()));
      const toAdd = newNodes.filter(n => !existingLabels.has(n.label.toLowerCase()));
      return [...prev, ...toAdd];
    });
    setPiEdges(prev => {
      const existingPairs = new Set(prev.map(e => `${e.from}-${e.to}`));
      const toAdd = newEdges.filter(e => !existingPairs.has(`${e.from}-${e.to}`));
      return [...prev, ...toAdd];
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
      <div style={{display:"flex",height:"100vh",background:T.bg,overflow:"hidden",transition:"background 0.3s"}}>
        <Sidebar active={active} onNavigate={(id)=>{setActive(id);if(id==="investigate")clearBadge();}} open={sideOpen} T={T} piNewCount={piNewCount}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
          <TopBar active={active} onNavigate={setActive} onToggle={()=>setSideOpen(v=>!v)} theme={theme} onToggleTheme={()=>setTheme(t=>t==="dark"?"light":"dark")} T={T}/>
          <div style={{flex:1,overflow:"hidden"}}>
            {active==="home"        && <Home        T={T} onNavigate={setActive}/>}
            {active==="explore"     && <ExploreSection     T={T} theme={theme}/>}
            {active==="timeline"    && <TimelineSection    T={T}/>}
            {active==="learn"       && <LearnSection       T={T}/>}
            {active==="reckon"      && <ReckonSection      T={T}/>}
            {active==="investigate" && <InvestigateSection T={T} nodes={piNodes} edges={piEdges} setNodes={setPiNodes} setEdges={setPiEdges}/>}
            {active==="research"    && <ResearchSection    T={T} onPushToBoard={pushToBoard} onNavigate={setActive}/>}
          </div>
        </div>
      </div>
    </>
  );
}