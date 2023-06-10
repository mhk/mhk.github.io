const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let db = new PouchDB('cardData');
let dbSync = undefined;
let cards = {};
let cardStartTime = new Date;
let lessonsData = {};
let exercises = {};
let currentExercise = [];
let currentTags = [];
let currentExerciseIndex = 0;
let repeatExercise = true;
let MAX_FAILURE = 1;
let failCount = 0;
let mobileStenoKeyboard = true;
let text_strokes = [];
let strokes = [];
let lastSync = undefined;

function createObject(object, variableName) {
    // Bind a variable whose name is the string variableName
    // to the object called 'object'
    let execString = variableName + " = object"
    console.log("Running '" + execString + "'");
    eval(execString)
}
function ignoreKeyEvent(event) {
    return event.target.classList.contains('ignoreKeyEvent') ||
        document.getElementById("overlay").style.display === "block" ||
        document.getElementById("helpOverlay").style.display === "block";
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
    const txt = textToLength();
    if(txt === undefined) return;
    const row = document.getElementById("toggleFullscreenRow");
    exercise.innerHTML = txt.join('\n');
});
function update_text(t, s) {
    steno.innerHTML = exerciseHandler(t, s);
}
function on(key) {
    document.getElementById(key).setAttribute('fill', '#f3f70f');
    // document.getElementById('char_'+key).setAttribute('fill', '#000000');
    let ease = null;
    if(isDifficultSelection() && isAutoaccept() && (ease = getPreslection()) !== null) {
        putCardBack(ease);
    }
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
    '*1'        : 'g',
    '*2'        : 'h',
    '*3'        : 'y',
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
    cardStartTime = new Date;
}
function resetHint() {
    failCount = 0;
    hints.innerHTML = '';
    showHint(0);
}
function preselectDifficulty(recommendedEase, height) {
    for(const ease of ["again", "hard", "good", "easy"]) {
        if(recommendedEase === ease) continue
        document.getElementById(ease.toLowerCase()).style.fontWeight = '';
        document.getElementById(ease.toLowerCase()).style.fontSize = '12px';
        document.getElementById(ease.toLowerCase()).style.height = '';
    }
    document.getElementById(recommendedEase).style.fontWeight = 'bold';
    document.getElementById(recommendedEase).style.fontSize = '';
    document.getElementById(recommendedEase).style.height = (height > 0)? height : '';
}
function showDifficulty(card=null) {
    // automate pre-selection
    // style: font-size: 22px; font-weight: bold;
    // style.fontSize: 22px; style.fontWeight: bold;
    document.getElementById("difficulty").style.display = '';
    const height = document.getElementById("release").clientHeight;
    if(isKeyboard() && isAutoaccept()) {
        document.getElementById("releaseKeys").style.display = "none";
    } else if(isKeyboard()) {
        hideStenoKeyboard();
    }

    if(isAutoaccept()) {
        const now = new Date;
        const diffS = Math.ceil((now - cardStartTime) / 1000);
        if(failCount > 1) preselectDifficulty('again', height);
        else if(failCount > 0) preselectDifficulty('hard', height);
        else if(diffS <= 10) preselectDifficulty('easy', height);
        else preselectDifficulty('good', height);
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
    document.getElementById("difficulty").style.display = "none";
    // don't automatically show release button since it belongs to the keyboard
    if(isKeyboard()) {
        showStenoKeyboard();
    }
}
function isDifficultSelection() {
    return document.getElementById("difficulty").style.display === '';
}
function isAutoaccept() {
    return document.getElementById("quickSelect").checked;
}
function getPreslection() {
    for(const ease of ["again", "hard", "good", "easy"]) {
        const element = document.getElementById(ease);
        if(element.style.fontWeight === 'bold') return element.value;
    }
    return null;
}
function isFsrs() {
    const settings = getDefaultSettings();
    return settings.scheduler.get() === 'FSRS';
}
function isKeyboard() {
    const settings = getDefaultSettings();
    return settings.keyboard.getBool();
}
function showFsrsStats(tags) {
    const cardStats = document.getElementById('cardStats');
    cardStats.innerHTML = '';
    if(!isFsrs()) return ;
    const settings = getDefaultSettings();
    const filteredCards = filterCardsByTags(tags);
    const minDue = cutOffDate(0);
    const maxDue = cutOffDate();
    const newMax = settings.newCards.getInt();
    const cardsMax = settings.maxCards.getInt();
    let cardsUndefined = 0;
    let newCardsShownToday = 0;
    let newCardsLearnedToday = 0;
    let newCardsCount = 0;
    let cardsShownToday = 0;
    let cardsLearnedToday = 0;
    let cardsDue = 0;
    for(const c of filteredCards) {
        if(c.scheduling === undefined) {
            cardsUndefined += 1;
            continue;
        }
        // all cards have scheduling information

        // cards that have been reviewed today and that are new 
        newCardsShownToday += ("New" !== c.state && c.scheduling.reviewLog[0].review >= minDue);
        // cards that have been reviewed the first time today
        newCardsCount += ("New" === c.state || c.scheduling.reviewLog[0].review >= minDue);
        // new cards successfully learned today
        newCardsLearnedToday += (c.scheduling.fsrsCard.due >= maxDue && c.scheduling.reviewLog[0].review >= minDue)

        // cards reviewed
        cardsShownToday += (c.scheduling.reviewLog.at(-1).review >= minDue);
        // cards not reviewed, but due
        cardsDue += (c.scheduling.fsrsCard.due < maxDue && !(c.scheduling.reviewLog.at(-1).review >= minDue));
        // cards successfully learned today
        cardsLearnedToday += (c.scheduling.fsrsCard.due >= maxDue && c.scheduling.reviewLog.at(-1).review >= minDue);
    }
    const newCardsMax = Math.min(cardsUndefined + newCardsCount, newMax);
    const dueCardsMax = Math.min(cardsUndefined + cardsShownToday + cardsDue, cardsMax);
    // console.log(`cardsUndefined: ${cardsUndefined}, newCardsShownToday ${newCardsShownToday}, newCardsCount: ${newCardsCount}, newCardsLearnedToday ${newCardsLearnedToday}, newMax: ${newMax}, newCardsMax: ${newCardsMax}`);
    // console.log(`cardsUndefined: ${cardsUndefined}, cardsLearnedToday: ${cardsLearnedToday}, cardsShownToday: ${cardsShownToday}, cardsDue: ${cardsDue}, cardsMax: ${cardsMax}, dueCardsMax: ${dueCardsMax}`);

    cardStats.innerHTML = 'New: ' + newCardsLearnedToday + '/' + newCardsShownToday + '/' + newCardsMax + ' Total: ' + cardsLearnedToday + '/' + cardsShownToday + '/' + dueCardsMax + '/' + filteredCards.length;
}
function exerciseHandler(t, s) {
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
                putCardBack = ease => {
                    putCardBack2(curExc, answer_strokes, ease);
                    showFsrsStats(currentTags);
                }
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
async function loadExercise(tags) {
    const data = await getCards(tags);
    if(tags.includes('difficult')) {
        const d = await getDifficultCards();
        data.push(...d);
    }
    currentTags = tags;
    showFsrsStats(tags);
    if(0 === Object.keys(data).length) {
        exercise.innerHTML = '';
        return ;
    }
    currentExercise = [...data];
    exercise.innerHTML = textToLength().join('\n');
    showHint(0);
    cardStartTime = new Date;
}
function getDefaultSettings() {
    const urlParams = new URLSearchParams(window.location.search);
    radioSetter = (name, value) => [...document.getElementsByName(name)].filter(c => c.value === value).map( c => c.checked = true);
    return {
        urlParams: urlParams,
        tags: {
            get: () => Object.values(document.querySelectorAll('input[class="tagCheckbox"]:checked')).map(c => c.id),
            getUrl: () => (urlParams.get('tags') || '').split(',').filter(s => '' !== s) || [],
            set: (tags) => {
                const tagSet = new Set(tags);
                [...document.getElementsByClassName("tagCheckbox")].map(c => c.checked = tagSet.has(c.id));
                urlParams.set('tags', [...tagSet].join(','));
            },
            default: [],
        },
        randomize: {
            get: () => document.getElementById('randomizeExercises').checked? '1' : '0',
            getUrl: () => urlParams.get('randomize') || '0',
            getBool: () => document.getElementById('randomizeExercises').checked,
            set: (randomize) => {
                document.getElementById('randomizeExercises').checked = ('1' === randomize);
                urlParams.set('randomize', randomize);
            },
            default: '0',
        },
        hand: {
            get: () => document.querySelector('input[name="handedness"]:checked').value,
            getUrl: () => urlParams.get('hand') || 'right',
            set: (hand) => {
                if('left' === hand) leftHandedStenoKeyboard();
                else rightHandedStenoKeyboard();
                urlParams.set('hand', hand);
            },
            default: 'right',
        },
        scheduler: {
            get:  () => document.querySelector('input[name="trainingType"]:checked').value,
            getUrl: () => urlParams.get('scheduler') || 'roundRobin',
            set: (scheduler) => {
                radioSetter('trainingType', scheduler);
                urlParams.set('scheduler', scheduler);
            },
            default: 'roundRobin',
        },
        failcount: {
            get: () => document.getElementById('failcount').value,
            getUrl: () => urlParams.get('failcount') || '2',
            set: (failcount) => {
                document.getElementById('failcount').value = failcount;
                urlParams.set('failcount', failcount);
                changeMax(undefined, failcount);
            },
            default: '2',
        },
        keyboard: {
            get: () => document.getElementById('hideStenoKeyboard').checked? '0' : '1',
            getUrl: () => urlParams.get('keyboard') || '1',
            getBool: () => !document.getElementById('hideStenoKeyboard').checked,
            set: (keyboard) => {
                document.getElementById('hideStenoKeyboard').checked = ('0' === keyboard);
                urlParams.set('keyboard', keyboard);
                if('0' === keyboard) hideStenoKeyboard();
                else showStenoKeyboard();
            },
            default: '1',
        },
        newCards: {
            get: () => document.getElementById('newCards').value,
            getUrl: () => urlParams.get('newCards') || '10',
            getInt: () => parseInt(document.getElementById('newCards').value),
            set: (newCards) => {
                document.getElementById('newCards').value = newCards;
                urlParams.set('newCards', newCards);
            },
            default: '10',
        },
        maxCards: {
            get: () => document.getElementById('maxCards').value,
            getUrl: () => urlParams.get('maxCards') || '100',
            getInt: () => parseInt(document.getElementById('maxCards').value),
            set: (maxCards) => {
                document.getElementById('maxCards').value = maxCards;
                urlParams.set('maxCards', maxCards);
            },
            default: '100',
        },
        quickSelect: {
            get: () => document.getElementById('quickSelect').checked? '1' : '0',
            getUrl: () => urlParams.get('quickSelect') || '0',
            set: (quickSelect) => {
                document.getElementById('quickSelect').checked = ('1' == quickSelect);
                urlParams.set('quickSelect', quickSelect);
            },
            default: '0',
        },
        dict: {
            get: () => document.querySelector('input[name="dictionary"]:checked').value,
            getUrl: () => urlParams.get('dict') || 'plover',
            set: (dict) => {
                radioSetter('dictionary', dict);
                urlParams.set('dict', dict);
            },
            default: 'plover',
        },
        cardPrios: {
            get: () => document.querySelector('input[name="cardPrios"]:checked').value,
            getUrl: () => urlParams.get('cardPrios') || 'newOverDue',
            set: (cardPrios) => {
                radioSetter('cardPrios', cardPrios);
                urlParams.set('cardPrios', cardPrios);
            },
            default: 'newOverDue',
        },
        loop: {
            get: () => '1',
            getUrl: () => urlParams.get('loop') || '1',
            set: (loop) => {},
            default: '1',
        },
        dbUrl: {
            get: () => document.getElementById('dbUrl').value,
            getUrl: () => urlParams.get('dbUrl') || '',
            set: (dbUrl) => {
                document.getElementById('dbUrl').value = dbUrl;
                urlParams.set('dbUrl', dbUrl);
            },
            default: '',
        }
    };
}
function getSettings() {
    // TODO: automate
    const settings = getDefaultSettings();
    return {'tags': settings.tags.get(),  'randomize': settings.randomize.get(),
        "hand": settings.hand.get(),  'scheduler':settings. scheduler.get(),
        "failcount": settings.failcount.get(),  "keyboard": settings.keyboard.get(),
        "newCards": settings.newCards.get(),  "maxCards": settings.maxCards.get(),
        "quickSelect": settings.quickSelect.get(),  "dict": settings.dict.get(),
        "cardPrios": settings.cardPrios.getUrl(), "dbUrl": settings.dbUrl.get(),
    };
}
function getUrlSettings() {
    // TODO: automate
    const settings = getDefaultSettings();
    return {'tags': settings.tags.getUrl(),  'randomize': settings.randomize.getUrl(),
        "hand": settings.hand.getUrl(),  'scheduler': settings.scheduler.getUrl(),
        "failcount": settings.failcount.getUrl(),  "keyboard": settings.keyboard.getUrl(),
        "newCards": settings.newCards.getUrl(),  "maxCards": settings.maxCards.getUrl(),
        "quickSelect": settings.quickSelect.getUrl(),  "dict": settings.dict.getUrl(),
        "cardPrios": settings.cardPrios.getUrl(), "dbUrl": settings.dbUrl.getUrl(),
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
        settings.newCards === urlSettings.newCards &&
        settings.maxCards === urlSettings.maxCards &&
        settings.quickSelect === urlSettings.quickSelect &&
        settings.dict === urlSettings.dict &&
        settings.cardPrios === urlSettings.cardPrios &&
        settings.dbUrl === urlSettings.dbUrl &&
        true
    );
}
function setSettings() {
    const settings = getDefaultSettings();
    for(const key of Object.keys(settings)) {
        if('urlParams'  === key) continue;
        const val = settings[key].getUrl()
        settings[key].set(val);
    }
    changeDbUrl(undefined);
    loadExercise(settings.tags.get());
}
function setUrlSettings() {
    const settings = getDefaultSettings();
    for(const key of Object.keys(settings)) {
        if('urlParams'  === key) continue;
        const val = settings[key].get()
        settings[key].set(val);
    }
    const refresh = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + settings.urlParams.toString();
    window.history.pushState({ path: refresh }, '', refresh);
    return settings;
}
function saveSettings(event) {
    const textfield = document.getElementById('peristedSettings');
    const name = textfield.value;
    db.get('pageSettings').then(data => {
        return data;
    }).catch(err => {
        if('missing' === err.reason) {
            return {
                _id: 'pageSettings',
                saves: {},
            };
        }
        throw err;
    }).then(data => {
        const settings = getSettings();
        data.saves[name] = settings;
        return db.put(data).then(data => textfield.value = '');
    });
}
function loadSettings(event) {
    const textfield = document.getElementById('peristedSettings');
    const name = textfield.value;
    db.get('pageSettings').then(data => {
        if(undefined === data.saves[name]) {
            console.log(`Failed to find saved settings '${name}'`);
            return ;
        }
        const newSettings = data.saves[name]
        const settings = getDefaultSettings();
        for(const key of Object.keys(newSettings)) {
            const val = newSettings[key];
            settings[key].set(val);
        }
        textfield.value = '';
    });
}
function deleteSettings(event) {
    const textfield = document.getElementById('peristedSettings');
    const name = textfield.value;
    db.get('pageSettings').then(data => {
        if(undefined !== data.saves[name]) delete data.saves[name];
        return db.put(data).then(data => textfield.value = '');
    });
}
function changeExercise() {
    currentExerciseIndex = 0;
    initNextExercise();
    settings = setUrlSettings();
    loadExercise(settings.tags.get());
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
    screen.orientation.lock('landscape-secondary');
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
    return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day, 2, 0, 0, 0))).toISOString();
}
function intersect(a, b) {
  var setB = new Set(b);
  return [...new Set(a)].filter(x => setB.has(x));
}
function annotateCardsWithLocalData(cards) { // modifies input
    const promises = [];
    for(const card of cards) {
        const id = card.collection + '::' + card.word;
        promises.push(
            db.get(id).then(data => {
                if(null !== data) card.scheduling = data;
                return card;
            }).catch(err => {
                if('missing' === err.reason) return card;
                throw err;
            }));
    }
    return Promise.all(promises);
}
function orderCardsDueAndNew(cards) {
    const maxDue = cutOffDate();
    const minDue = cutOffDate(0);
    const nonCards = [];
    const newCards = [];
    const lrnCards = [];
    const revCards = [];
    const rlnCards = [];
    const dueCards = [];
    const newCardsLearnedToday = cards.filter(c => (c.scheduling !== undefined &&
        c.scheduling.reviewLog.at(0).review >= minDue &&
        c.scheduling.fsrsCard.due >= maxDue)).length;
    const cardsLearnedToday = cards.filter(c => (c.scheduling !== undefined &&
        c.scheduling.reviewLog.at(-1).review >= minDue &&
        c.scheduling.fsrsCard.due >= maxDue)).length;
    const settings = getDefaultSettings();
    const newCardsMax = Math.max(0, settings.newCards.getInt() - newCardsLearnedToday);
    const cardsMax = Math.max(0, settings.maxCards.getInt() - cardsLearnedToday);
    for(let i = 0; i < cards.length; ++i) {
        // only include cards that are new or due this day
        if(undefined !== cards[i].scheduling &&
            cards[i].scheduling.fsrsCard.due >= maxDue) {
            continue;
        }
        if(undefined === cards[i].scheduling) {
            nonCards.push(cards[i]);
            continue;
        }
        const state = cards[i].scheduling.fsrsCard.state;
        if(cards[i].scheduling.reviewLog.at(-1).review >= minDue) {
            dueCards.push(cards[i]);
        } else if("New" == state) {
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
    dueCards.sort(cmp);
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
    dueCards.length = Math.min(dueCards.length, cardsMax);
    if(settings.cardPrios.get() === 'dueOverNew') {
        result = dueCards.concat(newCards);
    } else {
        result = newCards.concat(dueCards);
    }
    result.length = Math.min(result.length, cardsMax);
    if(settings.randomize.getBool()) {
        shuffleArray(result);
    }
    return result;
}
function getDifficultCards() {
    const settings = getDefaultSettings();
    const maxCards = settings.maxCards.getInt();
    return db.allDocs({include_docs: true}).then(response => {
        difficultCards = response.rows
            .filter(a => a.doc._id.startsWith('all::'))
            .sort((a, b) => b.doc.fsrsCard.difficulty - a.doc.fsrsCard.difficulty);
        difficultCards.length = maxCards;

        result = difficultCards.map(c => {
            const s = c.id.split('::').filter(s => '' !== s);
            if(s.length == 2) {
                const collection = cards[s[0]];
                const name = s[1];
                if(collection === undefined) return undefined;
                collection.cards[name].scheduling = c.doc;
                return collection.cards[name]
            }
            return undefined
        }).filter(a => a !== undefined);

        if(settings.randomize.getBool()) {
            shuffleArray(result);
        }
        return result;
    });
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
    const settings = getDefaultSettings();
    if(isFsrs()) {
        return annotateCardsWithLocalData(filteredCards).then(cards => orderCardsDueAndNew(cards));
    } else if(settings.randomize.getBool()) {
        shuffleArray(filteredCards);
    }
    return Promise.resolve(filteredCards);
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
        c.setAttribute('checked', tagSet.has(c.id));
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
                if(null === key) return ;
                key.onclick = key.ontouchstart = handleStenoTouch;
            });
        });
}
function loadLessons(lessons) {
    fetch(lessons)
        .then(response => response.json())
        .then(json => {
            lessonsData = json;
        });
}
function settingsOverlayOn() {
    document.getElementById("overlay").style.display = "block";
    db.get('pageSettings').then(data => {
        const saves = document.getElementById("saves");
        saves.innerHTML = '';
        for(const key of Object.keys(data.saves)) {
            const save = document.createElement("option");
            save.innerHTML = key;
            saves.appendChild(save);
        }
    }).catch(err => {
        if('missing' === err.reason) return ;
        throw err;
    });
}
function settingsOverlayOff() {
    document.getElementById("overlay").style.display = "none";
    if(!settingsChanged()) return ;
    changeExercise();
}
function showStenoKeyboard() {
    document.getElementById("releaseKeys").style.display = '';
    document.getElementById("stenoKeyboard").style.display = '';
}
function hideStenoKeyboard() {
    document.getElementById("releaseKeys").style.display = "none";
    document.getElementById("stenoKeyboard").style.display = "none";
}
function setHideStenoKeyboard(hide) {
    if(hide) {
        hideStenoKeyboard();
    } else {
        showStenoKeyboard();
    }
}
function checkNewCardsSettings(event) {
    const settings = getDefaultSettings();
    if(settings.newCards.getInt() > settings.maxCards.getInt()) {
        event.target.value = settings.maxCards.get();
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

    const listItem = document.createElement("li");
    const checkBox = document.createElement("input");
    const label = document.createElement("label");
    checkBox.type = 'checkbox';
    checkBox.id = 'difficult';
    checkBox.setAttribute('class', 'tagCheckbox');
    label.setAttribute('for', checkBox.id);
    label.innerHTML = 'Most difficult cards';
    listItem.appendChild(checkBox);
    listItem.appendChild(label);
    list.appendChild(listItem);
}
function helpOverlayOff(event) {
    document.getElementById("helpOverlay").style.display = "none";
}
function helpOverlayOn(event) {
    const story = document.getElementById("story");
    const rstory = document.getElementById("rope-story");
    const lesson = document.getElementById("plover-lesson");
    const card = currentExercise[currentExerciseIndex];
    story.innerHTML = '';
    rstory.innerHTML = '';
    lesson.innerHTML = '';
    if(undefined !== card.word) {
        getDefinitionOfWord(card.word);
    }
    if(undefined !== card.story) {
        story.innerHTML = '<h2>Story</h2>\n' + card.story;
    }
    if(undefined !== card.rope_story) {
        rstory.innerHTML = '<h2>Rope Story</h2>\n' + card.rope_story;
    }
    const lessons = intersect(card.tags, Object.keys(lessonsData));
    if(lessons.length > 0) {
        for(l of Object.keys(lessonsData)) {
            if(lessons.includes(l)) {
                lesson.innerHTML += lessonsData[l].content + '<br/>';
            }
        }
    }
    document.getElementById("helpOverlay").style.display = "block";
}
function getDefinitionOfWord(word) {
    const definition = document.getElementById("definition");
    definition.innerHTML = '';
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const header = document.createElement("h1");
    const content = document.createElement("div");
    header.innerHTML = word;
    summary.appendChild(header);
    details.appendChild(summary);
    details.appendChild(content);
    definition.appendChild(details);
    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
        .then(response => response.json())
        .then(json => {
            if(json.length == 0) return ;
            for(let i = 0; i < json[0].meanings.length; ++i) {
                const meaning = json[0].meanings[i];
                const partOfSpeech = document.createElement("h3");
                partOfSpeech.innerHTML = meaning.partOfSpeech;
                content.appendChild(partOfSpeech);
                const definitionList = document.createElement("ul");
                for(let j = 0; j < meaning.definitions.length; ++j) {
                    const def = meaning.definitions[j];
                    const listItem = document.createElement("li");
                    listItem.innerHTML = def.definition;
                    if(undefined !== def.example) {
                        listItem.innerHTML += '<br/>Example: <i>' + def.example + '</i>';
                    }
                    definitionList.appendChild(listItem);
                }
                content.appendChild(definitionList);
            }
        });
}
function changeDbUrl(event) {
    const settings = getDefaultSettings();
    const remoteCouch = settings.dbUrl.get();
    if(undefined !== dbSync) {
        dbSync.cancel();
        dbSync = undefined;
    }
    // no check needed as sync already checks
    sync();
}
function sync() {
    // TODO: use 'changes' and on('change', x => x)
    const settings = getDefaultSettings();
    const remoteCouch = settings.dbUrl.get();
    if('' === remoteCouch || undefined === remoteCouch) return ;
    const remote = new PouchDB(remoteCouch);
    dbSync = db.sync(remote, {
        live: true,
        retry: true
    });
    dbSync.on('paused', msg => {
        remote.info()
          .then(info => syncWorking())
          .catch(err => syncError());
    });
}
function syncWorking() {
    const syncDom = document.getElementById('sync-wrapper');
    syncDom.setAttribute('data-sync-state', 'syncing');
    const syncInfo = document.getElementById('syncInfo');
    lastSync = new Date();
    syncInfo.innerHTML = `${lastSync.toISOString()}: &#x1F7E2 Successfully synced<br/>`
}
function syncError() {
    const syncDom = document.getElementById('sync-wrapper');
    syncDom.setAttribute('data-sync-state', 'error');
    const syncInfo = document.getElementById('syncInfo');
    const now = new Date().toISOString();
    const last = (lastSync === undefined)? 'never' : `at ${lastSync.toISOString()}`;
    syncInfo.innerHTML = `${now}: &#x1F534 Last successful sync ${last}<br/>`
}

/*
 ********************
 *       MAIN       *
 ********************
 */

db.info(function(err, info) {
    db.changes({since: info.update_seq, continuous: true});
});
loadCards('rope/cards-all.json');
loadLessons('learn-plover/lessons.json');
document.addEventListener("DOMContentLoaded", function(event) {
    setStenoKeyboardWidth(mobileStenoKeyboard);
    if(!isMobile) hideFullScreenButton();
});
