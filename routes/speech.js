var express = require('express');
var router = express.Router();
const {Client} = require("pg");
const databaseclient = new Client({
    host:process.env.PGHOST,
    user:process.env.PGUSER,
    port:process.env.PGPORT,
    password:process.env.PGPASSWORD,
    database:process.env.PGDATABASE,
    ssl: true
});

const { getAudioDurationInSeconds } = require('get-audio-duration')
const fillerWords = ['um', 'uh', 'er', 'ah', 'like', 'okay', 'right', 'you know', 'basically', 'i mean', 'so', 'totally', 'just'];
// List of prepositions and other words: https://en.wikipedia.org/wiki/Most_common_words_in_English#Parts_of_speech
const ignore = ['to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'about', 'into', 'over', 'after', 'the', 'and', 'a', 'that',
  'i', 'it', 'not', 'he', 'as', 'you', 'is', 'be'];

/* GET users listing. */
router.get('/', function(req, res, next) {
  speechToText().then(transcript => {
    res.send(transcript);
    client.connect().then(()=> {
    client.query("SELECT * FROM account;", (err, dbres) => {
      res.json(dbres.rows[0]) 
    })
  })
  }).catch(console.error);
});

router.get('/mostFrequent', function(req, res, next) {
  speechToText().then(transcript => {
    let mostFrequent = getMostFrequent(transcript);
    res.send(mostFrequent);
  }).catch(console.error);
});

router.get('/filler', function(req, res, next) {
  speechToText().then(transcript => {
    let fillerMap = wordCount(transcript, true);
    // sort and output top three
    res.send(fillerMap);
  }).catch(console.error);
})

// File must be a full path
router.get('/wpm', function(req, res, next) {
  speechToText().then(transcript => {
    const file = req.body.file;
    getAudioDurationInSeconds(file).then((seconds) => {
      const totalWords = transcript.split(' ').length;
      const wpm = totalWords/(seconds/60);
      res.send(wpm.toString());
    }).catch(console.error);
  })
});

// File must be a full path
router.get('/duration', function(req, res, next) {
  const file = req.body.file;
  getAudioDurationInSeconds(file).then((duration) => {
    res.send(Math.ceil(duration).toString());
  }).catch(console.error);
});

// returns the justified words
router.get('/justified', function(req, res, next) {
  speechToText().then(transcript => {
    const justifiers = getJustifierWords();
    let phrases = [];
    for (const justifier of justifiers) {
      if (transcript.includes(justifier)) phrases.push(justifier);
    }
    res.send(phrases);
  }).catch(console.error);
});

// returns the complex words that were mentioned, provides suggestions
router.get('/complex', function(req, res, next) {
  speechToText().then(transcript => {
    const complexWords = getComplexWords();
    let phrases = [];
    for (const word of complexWords) {
      if (transcript.includes(word)) phrases.push(word);
    }
    res.send(phrases);
  }).catch(console.error);
});

async function speechToText() {
  // Imports the Google Cloud client library
  const speech = require('@google-cloud/speech');
  const fs = require('fs');

  // Creates a client
  const client = new speech.SpeechClient();

  // The name of the audio file to transcribe
  const fileName = './resources/test.wav';

  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(fileName);
  const audioBytes = file.toString('base64');

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'LINEAR16',
    // encoding: 'FLAC',
    // sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  return transcription;
}

function wordCount(text, filler = false) {
  var youKnowCount = (temp.match(/you know/g) || []).length;
  var iMeanCount = (temp.match(/i mean/g) || []).length;
  const textArray = text.replace(/,.?!;/g, '').toLowerCase().split(" ");
  let wordMap = {};
  let fillerMap = {};
  for (word of textArray) {
    if (filler && fillerWords.includes(word)) {
      fillerMap[word] = fillerMap[word] === undefined ? 1 : fillerMap[word] + 1;
    }
    wordMap[word] = wordMap[word] === undefined ? 1 : wordMap[word] + 1;
  }
  if (filler) {
    filler['you know'] = youKnowCount;
    filler['I mean'] = iMeanCount;
  }
  return filler ? fillerMap : wordMap;
}

function getMostFrequent(text) {
  const topKFrequent = (ignore, words, k) => {
    const map = {};
    const result = [];
    const bucket = Array(words.length + 1).fill().map(() => []);
    for (let word of words) {
      if (!ignore.includes(word)) {
        map[word] = ~~map[word] + 1;
      }
    }
    for (let num in map) {
        bucket[map[num]].push({[num]: map[num]});
    }
    for (let i = words.length; i >= 0 && k > 0; k--) {
        while (bucket[i].length === 0) i--;
        result.push(bucket[i].shift());
    }
    return result;
  };
  const textArray = text.replace(/,.?!;/g, '').toLowerCase().split(" ");
  return topKFrequent(ignore, textArray, 3);
}

// Reference: https://samwsoftware.github.io/Projects/hemingway/
function getJustifierWords() {
  return [
    "i believe",
    "i consider",
    "i don't believe",
    "i don't consider",
    "i don't feel",
    "i don't suggest",
    "i don't think",
    "i feel",
    "i hope to",
    "i might",
    "i suggest",
    "i think",
    "i was wondering",
    "i will try",
    "i wonder",
    "in my opinion",
    "is kind of",
    "is sort of",
    "just",
    "maybe",
    "perhaps",
    "possibly",
    "we believe",
    "we consider",
    "we don't believe",
    "we don't consider",
    "we don't feel",
    "we don't suggest",
    "we don't think",
    "we feel",
    "we hope to",
    "we might",
    "we suggest",
    "we think",
    "we were wondering",
    "we will try",
    "we wonder"
  ];
}

// Reference: https://samwsoftware.github.io/Projects/hemingway/
function getComplexWords() {
  return {
    "a number of": ["many", "some"],
    abundance: ["enough", "plenty"],
    "accede to": ["allow", "agree to"],
    accelerate: ["speed up"],
    accentuate: ["stress"],
    accompany: ["go with", "with"],
    accomplish: ["do"],
    accorded: ["given"],
    accrue: ["add", "gain"],
    acquiesce: ["agree"],
    acquire: ["get"],
    additional: ["more", "extra"],
    "adjacent to": ["next to"],
    adjustment: ["change"],
    admissible: ["allowed", "accepted"],
    advantageous: ["helpful"],
    "adversely impact": ["hurt"],
    advise: ["tell"],
    aforementioned: ["remove"],
    aggregate: ["total", "add"],
    aircraft: ["plane"],
    "all of": ["all"],
    alleviate: ["ease", "reduce"],
    allocate: ["divide"],
    "along the lines of": ["like", "as in"],
    "already existing": ["existing"],
    alternatively: ["or"],
    ameliorate: ["improve", "help"],
    anticipate: ["expect"],
    apparent: ["clear", "plain"],
    appreciable: ["many"],
    "as a means of": ["to"],
    "as of yet": ["yet"],
    "as to": ["on", "about"],
    "as yet": ["yet"],
    ascertain: ["find out", "learn"],
    assistance: ["help"],
    "at this time": ["now"],
    attain: ["meet"],
    "attributable to": ["because"],
    authorize: ["allow", "let"],
    "because of the fact that": ["because"],
    belated: ["late"],
    "benefit from": ["enjoy"],
    bestow: ["give", "award"],
    "by virtue of": ["by", "under"],
    cease: ["stop"],
    "close proximity": ["near"],
    commence: ["begin or start"],
    "comply with": ["follow"],
    concerning: ["about", "on"],
    consequently: ["so"],
    consolidate: ["join", "merge"],
    constitutes: ["is", "forms", "makes up"],
    demonstrate: ["prove", "show"],
    depart: ["leave", "go"],
    designate: ["choose", "name"],
    discontinue: ["drop", "stop"],
    "due to the fact that": ["because", "since"],
    "each and every": ["each"],
    economical: ["cheap"],
    eliminate: ["cut", "drop", "end"],
    elucidate: ["explain"],
    employ: ["use"],
    endeavor: ["try"],
    enumerate: ["count"],
    equitable: ["fair"],
    equivalent: ["equal"],
    evaluate: ["test", "check"],
    evidenced: ["showed"],
    exclusively: ["only"],
    expedite: ["hurry"],
    expend: ["spend"],
    expiration: ["end"],
    facilitate: ["ease", "help"],
    "factual evidence": ["facts", "evidence"],
    feasible: ["workable"],
    finalize: ["complete", "finish"],
    "first and foremost": ["first"],
    "for the purpose of": ["to"],
    forfeit: ["lose", "give up"],
    formulate: ["plan"],
    "honest truth": ["truth"],
    however: ["but", "yet"],
    "if and when": ["if", "when"],
    impacted: ["affected", "harmed", "changed"],
    implement: ["install", "put in place", "tool"],
    "in a timely manner": ["on time"],
    "in accordance with": ["by", "under"],
    "in addition": ["also", "besides", "too"],
    "in all likelihood": ["probably"],
    "in an effort to": ["to"],
    "in between": ["between"],
    "in excess of": ["more than"],
    "in lieu of": ["instead"],
    "in light of the fact that": ["because"],
    "in many cases": ["often"],
    "in order to": ["to"],
    "in regard to": ["about", "concerning", "on"],
    "in some instances ": ["sometimes"],
    "in terms of": ["omit"],
    "in the near future": ["soon"],
    "in the process of": ["omit"],
    inception: ["start"],
    "incumbent upon": ["must"],
    indicate: ["say", "state", "or show"],
    indication: ["sign"],
    initiate: ["start"],
    "is applicable to": ["applies to"],
    "is authorized to": ["may"],
    "is responsible for": ["handles"],
    "it is essential": ["must", "need to"],
    literally: ["omit"],
    magnitude: ["size"],
    maximum: ["greatest", "largest", "most"],
    methodology: ["method"],
    minimize: ["cut"],
    minimum: ["least", "smallest", "small"],
    modify: ["change"],
    monitor: ["check", "watch", "track"],
    multiple: ["many"],
    necessitate: ["cause", "need"],
    nevertheless: ["still", "besides", "even so"],
    "not certain": ["uncertain"],
    "not many": ["few"],
    "not often": ["rarely"],
    "not unless": ["only if"],
    "not unlike": ["similar", "alike"],
    notwithstanding: ["in spite of", "still"],
    "null and void": ["use either null or void"],
    numerous: ["many"],
    objective: ["aim", "goal"],
    obligate: ["bind", "compel"],
    obtain: ["get"],
    "on the contrary": ["but", "so"],
    "on the other hand": ["omit", "but", "so"],
    "one particular": ["one"],
    optimum: ["best", "greatest", "most"],
    overall: ["omit"],
    "owing to the fact that": ["because", "since"],
    participate: ["take part"],
    particulars: ["details"],
    "pass away": ["die"],
    "pertaining to": ["about", "of", "on"],
    "point in time": ["time", "point", "moment", "now"],
    portion: ["part"],
    possess: ["have", "own"],
    preclude: ["prevent"],
    previously: ["before"],
    "prior to": ["before"],
    prioritize: ["rank", "focus on"],
    procure: ["buy", "get"],
    proficiency: ["skill"],
    "provided that": ["if"],
    purchase: ["buy", "sale"],
    "put simply": ["omit"],
    "readily apparent": ["clear"],
    "refer back": ["refer"],
    regarding: ["about", "of", "on"],
    relocate: ["move"],
    remainder: ["rest"],
    remuneration: ["payment"],
    require: ["must", "need"],
    requirement: ["need", "rule"],
    reside: ["live"],
    residence: ["house"],
    retain: ["keep"],
    satisfy: ["meet", "please"],
    shall: ["must", "will"],
    "should you wish": ["if you want"],
    "similar to": ["like"],
    solicit: ["ask for", "request"],
    "span across": ["span", "cross"],
    strategize: ["plan"],
    subsequent: ["later", "next", "after", "then"],
    substantial: ["large", "much"],
    "successfully complete": ["complete", "pass"],
    sufficient: ["enough"],
    terminate: ["end", "stop"],
    "the month of": ["omit"],
    therefore: ["thus", "so"],
    "this day and age": ["today"],
    "time period": ["time", "period"],
    "took advantage of": ["preyed on"],
    transmit: ["send"],
    transpire: ["happen"],
    "until such time as": ["until"],
    utilization: ["use"],
    utilize: ["use"],
    validate: ["confirm"],
    "various different": ["various", "different"],
    "whether or not": ["whether"],
    "with respect to": ["on", "about"],
    "with the exception of": ["except for"],
    witnessed: ["saw", "seen"]
  };
}

module.exports = router;