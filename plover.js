const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let db = new PouchDB('cardData');
let cards = {};
let exercises = {};
let currentExercise = {};
let currentExerciseIndex = 0;
let repeatExercise = true;
let MAX_FAILURE = 1;
let failCount = 0;
let exerciseHandler = (t, s) => t;
let mobileStenoKeyboard = true;
let text_strokes = [];
let strokes = [];
function createObject(object, variableName) {
    // Bind a variable whose name is the string variableName
    // to the object called 'object'
    let execString = variableName + " = object"
    console.log("Running '" + execString + "'");
    eval(execString)
}
function ignoreKeyEvent(event) {
    return event.target.classList.contains('ignoreKeyEvent');
}

document.addEventListener('keydown', (event) => { logKeyDown(event) }, false);
function logKeyDown(event) {
    if(ignoreKeyEvent(event)) return ;
    if(!Object.values(steno2key).includes(event.key)) return ;
    pyKeyDown(event.key);
}

document.addEventListener('keyup', (event) => { logKeyUp(event) }, false);
function logKeyUp(event) {
    if(ignoreKeyEvent(event)) return ;
    if(!Object.values(steno2key).includes(event.key)) return ;
    pyKeyUp(event.key);
}
function hideFullScreenButton() {
    const row = document.getElementById("toggleFullscreenRow");
    row.style.display = 'none';
}
function showFullScreenButton() {
    const row = document.getElementById("toggleFullscreenRow");
    row.style.display = '';
}
window.addEventListener('resize', (event) => {
    const txt = textToLength();
    if(txt === undefined) return;
    const row = document.getElementById("toggleFullscreenRow");
    exercise.innerHTML = txt.join('\n');
    switch (screen.orientation.type) {
      case "landscape-primary":
      case "landscape-secondary":
        hideFullScreenButton();
        break;
      case "portrait-secondary":
      case "portrait-primary":
        showFullScreenButton();
        break;
      default:
        // do nothing
    }
});
function update_text(t, s) {
    steno.innerHTML = exerciseHandler(t, s);
}
function on(key) {
    document.getElementById(key).setAttribute('fill', '#f3f70f');
    // document.getElementById('char_'+key).setAttribute('fill', '#000000');
}
function off(key) {
    document.getElementById(key).setAttribute('fill', '#666666');
    // document.getElementById('char_'+key).setAttribute('fill', '#efefef');
}
function stroke(s) {
    strokes.push(s);
}
function isOff(key) {
    return (document.getElementById(key).getAttribute('fill') == '#666666');
}
function toggleEvent(event) {
    toggle(event.target.id);
}
function toggle(key) {
    if(isOff(key)) {
        on(key);
    } else {
        off(key);
    }
}
const steno2key = {
    'S-'        : 'a',
    'T-'        : 'w',
    'K-'        : 's',
    'P-'        : 'e',
    'W-'        : 'd',
    'H-'        : 'r',
    'R-'        : 'f',
    'A-'        : 'c',
    'O-'        : 'v',
    '*'         : 't',
    '-E'        : 'n',
    '-U'        : 'm',
    '-F'        : 'u',
    '-R'        : 'j',
    '-P'        : 'i',
    '-B'        : 'k',
    '-L'        : 'o',
    '-G'        : 'l',
    '-T'        : 'p',
    '-S'        : ';',
    '-D'        : '[',
    '-Z'        : '\'',
};
function release(event) {
    const collection = document.getElementsByClassName("key");
    for (let i = 0; i < collection.length; i++) {
        const stenoKey = collection[i].getAttribute('id');
        if(!isOff(stenoKey)) {
            pyKeyDown(steno2key[stenoKey]);
        }
    }
    for (let i = 0; i < collection.length; i++) {
        const stenoKey = collection[i].getAttribute('id');
        if(!isOff(stenoKey)) {
            pyKeyUp(steno2key[stenoKey]);
            off(stenoKey);
        }
    }
}
function rightHandedStenoKeyboard() { // mirror, left handed, right handed
    if(document.getElementById('svgg').getAttribute('transform') === null) { // right handed
        document.getElementById('svgg').setAttribute('transform', 'scale (-1, 1)');
        document.getElementById('svgg').setAttribute('transform-origin', 'center');
    }
    document.getElementById('rightHanded').checked = true;
}
function leftHandedStenoKeyboard() { // mirror, left handed, right handed
    if(document.getElementById('svgg').getAttribute('transform') !== null) { // left handed
        document.getElementById('svgg').removeAttribute('transform');
        document.getElementById('svgg').removeAttribute('transform-origin');
    }
    document.getElementById('leftHanded').checked = true;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
function getExerciseData(ex, chap) {
    for(let i = 0; i < exercises.length; ++i) {
        if(exercises[i].name !== ex) continue;
        for(let j = 0; j < exercises[i].chapters.length; ++j) {
            const chapter = exercises[i].chapters[j];
            if(chapter.name !== chap) continue;
            return chapter.data;
        }
    }
    return '';
}
function changeMax(event, val) {
    MAX_FAILURE = parseInt(val);
    showHint(0);
}
function showHint(i=1) {
    if(currentExercise.length === 0) return ;
    if(-1 === MAX_FAILURE) return ;
    failCount += i;
    if(failCount < MAX_FAILURE) return ;
    const hintList = steno_hints(currentExercise[currentExerciseIndex].word).toJs();
    hints.innerHTML = hintList.join(', ');
}
function initNextExercise() {
    reset_text();
    resetHint();
    strokes.length = 0;
    text_strokes.length = 0;
}
function resetHint() {
    failCount = 0;
    hints.innerHTML = '';
    showHint(0);
}
function showDifficulty(card=null) {
    // automate pre-selection
    // style: font-size: 22px; font-weight: bold;
    // style.fontSize: 22px; style.fontWeight: bold;
    for(const ease of ["again", "hard", "good", "easy"]) {
        document.getElementById(ease).style.display = "block";
    }
    document.getElementById("release").style.display = "none";
    if(isKeyboard()) {
        hideStenoKeyboard();
    }
    if(null !== card) {
        const newCards = getCardDifficulties(card);
        for(const ease of Object.keys(newCards)) {
            document.getElementById(ease.toLowerCase()).style.padding = '9px 28px';
            document.getElementById(ease.toLowerCase()).innerHTML =
                ease + '<br/><small>' + getEstimate(newCards[ease].card.due) + '</small>';
        }
    }
}
function hideDifficulty() {
    // TODO: the TR's are using space it would be nice to just replace the buttons (perhaps a table within a table?)
    for(const ease of ["again", "hard", "good", "easy"]) {
        document.getElementById(ease).style.display = "none";
        document.getElementById(ease).style.padding = "";
    }
    if(isKeyboard()) {
        showStenoKeyboard();
    }
}
function isDifficultSelection() {
    return document.getElementById("release").style.display == "none";
}
function isFsrs() {
    return document.getElementById('spacedRepetitionTraining').checked;
}
function isKeyboard() {
    return !document.getElementById('hideStenoKeyboard').checked;
}
function loadExercise(tags) {
    const data = getCards(tags);
    if(0 === Object.keys(data).length) {
        exercise.innerHTML = '';
        return ;
    }
    currentExercise = [...data];
    exercise.innerHTML = textToLength().join('\n');
    showHint(0);
    exerciseHandler = (t, s) => {
        console.log(currentExercise.length, t);
        if(currentExercise.length === 0 && repeatExercise) changeExercise();
        if(currentExercise.length === 0) return s;
        let result = t.trim();
        // document strokes
        const wc = result.split(' ').filter(ss => ss !== '').length;
        // TODO: Handle '*'
        if(wc > text_strokes.length) {
            text_strokes.push(strokes.join('/'));
            strokes.length = 0;
        } else if(text_strokes.length > 0) {
            const last = text_strokes.length - 1;
            text_strokes[last] = [text_strokes[last]].concat(strokes).join('/');
            strokes.length = 0;
        }
        if(undefined !== currentExercise[currentExerciseIndex].word) {
            result = result.split(' ').at(-1);
        }
        const curExc = currentExercise[currentExerciseIndex];
        if(result === curExc.word) {
            const answer_strokes = text_strokes.join(', ');
            console.log(answer_strokes);
            if(isFsrs()) {
                putCardBack = ease => putCardBack2(curExc, answer_strokes, ease);
                showDifficulty(curExc);
            } else {
                ++currentExerciseIndex;
                exercise.innerHTML = textToLength().join('\n');
                initNextExercise();
            }
            return '';
        } else {
            showHint();
        }
        return result;
    };
}
function getSettings() {
    const tags = getTagsFromSettings();
    const randomize = document.getElementById('randomizeExercises').checked? '1' : '0';
    const keyboard = document.getElementById('hideStenoKeyboard').checked? '0' : '1';
    const handedness = document.querySelector('input[name="handedness"]:checked').value;
    const scheduler = document.querySelector('input[name="trainingType"]:checked').value;
    const failcount = document.getElementById('failcount').value;
    return {'tags': tags, 'randomize': randomize,
        "hand": handedness, 'scheduler': scheduler,
        "failcount": failcount, "keyboard": keyboard,
    };
}
function getUrlSettings() {
    const urlParams = new URLSearchParams(window.location.search);
    const tags = getTagsFromUrl(urlParams);
    const randomize = urlParams.get('randomize') || '0';
    const handedness = urlParams.get('hand') || 'right';
    const scheduler = urlParams.get('scheduler') || 'roundRobin';
    const failcount = urlParams.get('failcount') || '2';
    const keyboard = urlParams.get('keyboard') || '1';
    return {'tags': tags, 'randomize': randomize,
        "hand": handedness, 'scheduler': scheduler,
        "failcount": failcount, "keyboard": keyboard,
    };
}
function settingsChanged() {
    const urlSettings = getUrlSettings();
    const settings = getSettings();
    const intersection = intersect(settings.tags, urlSettings.tags);
    return !(intersection.length === settings.tags.length &&
        settings.tags.length === urlSettings.tags.length &&
        settings.randomize === urlSettings.randomize &&
        settings.hand === urlSettings.hand &&
        settings.scheduler === urlSettings.scheduler &&
        settings.failcount === urlSettings.failcount &&
        settings.keyboard === urlSettings.keyboard &&
        true
    );
}
function setSettings() {
    const randExcCheckbox = document.getElementById('randomizeExercises');
    const hideStenoCheckbox = document.getElementById('hideStenoKeyboard');
    const urlSettings = getUrlSettings();
    randExcCheckbox.checked = ('1' === urlSettings.randomize);
    hideStenoCheckbox.checked = ('0' === urlSettings.keyboard);
    rightHandedStenoKeyboard();
    if('left' === urlSettings.hand) {
        leftHandedStenoKeyboard();
    }
    showStenoKeyboard();
    if(hideStenoCheckbox.checked) {
        hideStenoKeyboard();
    }
    [...document.getElementsByName('trainingType')].filter(c => c.value === urlSettings.scheduler).map(
        c => c.checked = true);
    document.getElementById('failcount').value = urlSettings.failcount;
    changeMax(undefined, urlSettings.failcount);
    setTagsInSettings(urlSettings.tags);
    loadExercise(urlSettings.tags);
}
function setUrlSettings() {
    const urlParams = new URLSearchParams(window.location.search);
    const settings = getSettings();
    for(const key of Object.keys(settings)) {
        switch(key) {
            case 'tags':
                urlParams.set(key, settings[key].join(','));
                break;
            default:
                urlParams.set(key, settings[key]);
        }
    }
    const refresh = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + urlParams.toString();
    window.history.pushState({ path: refresh }, '', refresh);
    return settings;
}
function changeExercise() {
    currentExerciseIndex = 0;
    initNextExercise();
    settings = setUrlSettings();
    loadExercise(settings.tags);
}
function textToLength() {
    const exc = document.getElementById('exercise');
    // TODO: Fix proper handling of units
    const padding = window.getComputedStyle(exc, null).getPropertyValue('padding'); // left vs right ...
    if(padding != '4px') alert('Wrong padding. Padding is not dynamical, yet.');
    const maxWidth = exc.clientWidth - (4 * 2);
    return textToLength3(maxWidth, 2);
}
function textToLength3(maxWidth, rowCount) {
    if(currentExercise.length <= 0) return ;
    const test = document.getElementById("Test");
    let rows = [];
    let counts = [];
    let i = 0;
    for(let r = 0; r < rowCount && i < currentExercise.length; ++r) {
        let k = 0;
        let color = '#929292'; // green '#005a00'
        let s = '';
        if(currentExerciseIndex > i) s += '<span style="color:' + color + '">';
        let p = '';
        for(; i < currentExercise.length; ++i) {
            if(i === currentExerciseIndex) s += '</span>';
            s += currentExercise[i].word;
            test.innerHTML = s;
            const height = test.clientHeight + 1;
            const width = test.clientWidth + 1;
            if(width > maxWidth) break;
            p = s;
            ++k;
            s += ' ';
        }
        if(currentExerciseIndex >= i) p += '</span>';
        if(r === 0 && p.endsWith('</span>')) {
            // remove first row
            for(; k > 0; --k) currentExercise.shift();
            r = -1;
            i = 0;
            currentExerciseIndex = 0;
       } else {
           rows.push(p);
       }
    }
    return rows;
}
function setStenoKeyboardWidth(useMobileWidth) {
    document.getElementById('svg').setAttribute('viewBox', (useMobileWidth)?
        "0.0 0.0 1235.1653543307086 337.7296587926509" :
        "0.0 0.0 1120.6010498687665 341.1994750656168"
    );
}
function openFullscreen() {
    /* Get the documentElement (<html>) to display the page in fullscreen */
    const elem = document.documentElement;

    /* View in fullscreen */
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
    screen.orientation.lock('landscape');
}
/* Close fullscreen */
function closeFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
}
function handleStenoTouch(event) {
    event.preventDefault();
    toggleEvent(event);
}
function cutOffDate(day=1) {
    const now = new Date;
    return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day, 5, 0, 0, 0))).toISOString();
}
function intersect(a, b) {
  var setB = new Set(b);
  return [...new Set(a)].filter(x => setB.has(x));
}
function annotateCardsWithLocalData(cards) { // modifies input
    for(const card of cards) {
        const id = card.collection + '::' + card.word;
        const data = JSON.parse(localStorage.getItem(id));
        if(null === data) continue;
        card.scheduling = data;
    }
    return cards;
}
function orderCardsDueAndNew(cards) {
    const maxDue = cutOffDate();
    const minDue = cutOffDate(-1);
    const nonCards = [];
    const newCards = [];
    const lrnCards = [];
    const revCards = [];
    const rlnCards = [];
    const dueCards = [];
    const newCardsMax = parseInt(document.getElementById('newCards').value);
    const dueCardsMax = parseInt(document.getElementById('maxCards').value);
    for(let i = 0; i < cards.length; ++i) {
        // only include cards that are new or due this day
        if(undefined !== cards[i].scheduling &&
            cards[i].scheduling.fsrsCard.due > maxDue) {
            continue;
        }
        if(undefined === cards[i].scheduling) {
            nonCards.push(cards[i]);
            continue;
        }
        const state = cards[i].scheduling.fsrsCard.state;
        if("New" == state) {
            newCards.push(cards[i]);
        } else if("Learning" == state) {
            lrnCards.push(cards[i]);
        } else if("Relearning" == state) {
            rlnCards.push(cards[i]);
        } else if("Review" == state) {
            revCards.push(cards[i]);
        } else {
            console.log('Invalid state found: ' + cards[i]);
        }
    }
    // sort by due date (before rank was used for stability)
    const cmp = (a, b) => a.scheduling.fsrsCard.due.localeCompare(b.scheduling.fsrsCard.due);
    newCards.sort(cmp);
    lrnCards.sort(cmp);
    rlnCards.sort(cmp);
    revCards.sort(cmp);
    // non cards are sorted by rank or if that is not possible by alphabetical order
    nonCards.sort((a, b) => {
        if(undefined === a.rank && undefined !== b.rank) return 1
        if(undefined !== a.rank && undefined === b.rank) return -1
        if(undefined === a.rank && undefined === b.rank) return a.word.localeCompare(b.word);
        return a.rank - b.rank;
    });
    // new and unseen cards
    newCards.push(...nonCards);
    newCards.length = Math.min(newCards.length, newCardsMax);
    // learn, relearn and review cards
    dueCards.push(...lrnCards); // first learn to increase knowledge
    dueCards.push(...rlnCards); // next relearn to get back lost knowledge
    dueCards.push(...revCards); // finally review to steady knowledge
    dueCards.length = Math.min(dueCards.length, dueCardsMax);
    if(document.getElementById('randomizeExercises').checked) {
        shuffleArray(newCards);
        shuffleArray(dueCards);
    }
    if(!document.getElementById('newOverDue').checked) {
        return dueCards.concat(newCards);
    }
    return newCards.concat(dueCards);
}
// Fully Qualified Tags to tags per collection
function fqtags2tagsByCollection(tags) {
    const tagsByCollection = tags.reduce(function(acc, cur, i) {
        const s = cur.split('::').filter(s => '' !== s);
        if(s.length == 2) {
            const collection = s[0];
            const tag = s[1];
            if(undefined === acc[collection]) {
                acc[collection] = [];
            }
            acc[collection].push(tag);
        }
        return acc;
    }, {});
    return tagsByCollection;
}
function filterCardsByTags(fqtags) {
    const tagsByCollection = fqtags2tagsByCollection(fqtags);
    const result = [];
    for(const name of Object.keys(tagsByCollection)) {
        const collection = cards[name];
        if(collection === undefined) continue;
        const tags = tagsByCollection[name];
        const filteredCards = Object.values(collection.cards).filter(c => intersect(c.tags, tags).length > 0);
        result.push(...filteredCards);
        result.map(c => c.collection = name);
    }
    return result;
}
function getCards(tags) {
    const filteredCards = filterCardsByTags(tags);
    if(isFsrs()) {
        annotateCardsWithLocalData(filteredCards);
        return orderCardsDueAndNew(filteredCards);
    }
    if(document.getElementById('randomizeExercises').checked) {
        shuffleArray(filteredCards);
    }
    return filteredCards;
}
function py2js(pyObj) {
    const toObject = (map = new Map) =>
        Object.fromEntries
    ( Array.from
        ( map.entries()
            , ([ k, v ]) =>
            v instanceof Map
            ? [ k, toObject (v) ]
            : [ k, v ]
        )
    );
    return toObject(pyObj.toJs());
}
function fsrs() { // deprecated
    const [fsrsCard, now, fsrsPy] = [{"due": "2023-05-05 11:41:51.284324", "stability": 0, "difficulty": 0, "elapsed_days": 0, "scheduled_days": 0, "reps": 0, "lapses": 0, "state": "New"}, new Date().toISOString(), pyscript.interpreter.globals.get('fsrs')];
    const cardPy = fsrsPy.newCardJs();
    const card = py2js(cardPy);
    const newCardsPy = fsrsPy.repeatJs(card, now);
    const newCards = py2js(newCardsPy);

    JSON.parse(localStorage.getItem(id));
    newCardsPy = fsrsPy.repeatJs(newCard, now).toJs();
    newCards = toObject(newCardsPy);
    return newCards;

    /*
    const collection = {'name': 'Plover'};
    const card = {'word': 'the'};
    const id = collection.name + '::' + card.word;
    const ease = 'Again';
    let cardData = JSON.parse(localStorage.getItem(id));
    if(null === cardData) {
        const cardFsrsDataPy = fsrsPy.newCardJs().toJs();
        const cardFsrsData = toObject(cardFsrsDataPy);
        cardData = {'fsrs': cardFsrsData, 'answers': []}
    }
 */
}
function getEstimate(due) {
    const now = new Date;
    const next = new Date(due);
    const diffM = Math.ceil((next - now) / 60000);
    if(diffM <= 5) return `&lt; ${diffM} minute${diffM === 1? '' : 's'}`;
    if(diffM <= 55) return `&lt; ${Math.ceil(diffM / 5) * 5} Minutes`;
    const diffH = Math.ceil(diffM / 60);
    if(diffM < 24) return `&lt; ${diffH} hour${diffH === 1? '' : 's'}`;
    const diffD = Math.ceil(diffH / 24);
    if(diffD < 7) return `&lt; ${diffD} day${diffD === 1? '' : 's'}`;
    const diffW = Math.ceil(diffD / 7);
    if(diffW < 5) return `&lt; ${diffW} week${diffW === 1? '' : 's'}`;
    const diffMon = Math.ceil(diffD / 30.416);
    if(diffW < 13) return `&lt; ${diffMon} month${diffMon === 1? '' : 's'}`;
    const diffY = Math.ceil(diffD / 365);
    return `&lt; ${diffY} year${diffY === 1? '' : 's'}`;
}
function getCardDifficulties(card) {
    const now = new Date().toISOString();
    const fsrsPy = pyscript.interpreter.globals.get('fsrs');
    if(undefined === card.scheduling) {
        const cardPy = fsrsPy.newCardJs();
        const data = py2js(cardPy);
        card.scheduling = {
            fsrsCard: data,
            reviewLog: []
        };
    }
    const newCardsPy = fsrsPy.repeatJs(card.scheduling.fsrsCard, now);
    return py2js(newCardsPy);
}
function putCardBack2(card, answer, ease) {
    const newCards = getCardDifficulties(card);
    newCards[ease].review_log.answer = answer;
    card.scheduling.fsrsCard = newCards[ease].card;
    card.scheduling.reviewLog.push(newCards[ease].review_log);
    card.scheduling._id = card.collection + '::' + card.word;
    localStorage.setItem(card.scheduling._id, JSON.stringify(card.scheduling));
    db.put(card.scheduling, function(err, response) {
        if (err) { return console.log(err); }
        // handle response
        console.log(response);
    });
    console.log(card.scheduling);
    hideDifficulty();

    ++currentExerciseIndex;
    exercise.innerHTML = textToLength().join('\n');
    initNextExercise();
}
let putCardBack = ease => putCardBack2(null, null, ease);
function onAgain(event) {
    putCardBack('Again');
}
function onHard(event) {
    putCardBack('Hard');
}
function onGood(event) {
    putCardBack('Good');
}
function onEasy(event) {
    putCardBack('Easy');
}
function getTagsFromUrl(urlParams) {
    return (urlParams.get('tags') || '').split(',').filter(s => '' !== s);
}
function getTagsFromSettings() {
    return Object.values(document.getElementsByClassName("tagCheckbox")).filter(c => c.checked).map(c => c.id);
}
function setTagsInSettings(tags) {
    const tagSet = new Set(tags);
    Object.values(document.getElementsByClassName("tagCheckbox")).map(c => {
        if(tagSet.has(c.id)) {
            c.setAttribute('checked', true);
        }
    });
}
function loadCards(deck) {
    fetch(deck)
        .then(response => response.json())
        .then(json => {
            const name = json['name'];
            json['path'] = deck;
            cards[name] = json;

            addCardTags();

            setSettings();
            Object.keys(steno2key).forEach(id => {
                const key = document.getElementById(id);
                key.onclick = key.ontouchstart = handleStenoTouch;
            });
        });
}
function cardOverlayOn() {
    document.getElementById("overlay").style.display = "block";
}
function cardOverlayOff() {
    document.getElementById("overlay").style.display = "none";
    if(!settingsChanged()) return ;
    changeExercise();
}
function showStenoKeyboard() {
    document.getElementById("release").style.display = "block";
    document.getElementById("stenoKeyboard").style.display = "block";
}
function hideStenoKeyboard() {
    document.getElementById("release").style.display = "none";
    document.getElementById("stenoKeyboard").style.display = "none";
}
function setHideStenoKeyboard(hide) {
    if(hide) {
        hideStenoKeyboard();
    } else {
        showStenoKeyboard();
    }
}
function addCardTags() {
    const list = document.getElementById("cardLabels");
    list.innerHTML = '';
    for(const tag of cards.all.tags) {
        const listItem = document.createElement("li");
        const checkBox = document.createElement("input");
        const label = document.createElement("label");
        checkBox.type = 'checkbox';
        checkBox.id = cards.all.name + '::' + tag;
        checkBox.setAttribute('class', 'tagCheckbox');
        label.setAttribute('for', checkBox.id);
        label.innerHTML = tag;
        listItem.appendChild(checkBox);
        listItem.appendChild(label);
        list.appendChild(listItem);
    }
}

/*
 ********************
 *       MAIN       *
 ********************
 */

db.info(function(err, info) {
    db.changes({since: info.update_seq, continuous: true});
});
loadCards('./rope/cards-all.json');
document.addEventListener("DOMContentLoaded", function(event) {
    setStenoKeyboardWidth(mobileStenoKeyboard);
    if(!isMobile) hideFullScreenButton();
});
