const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let cards = {};
let exercises = {};
let currentExercise = {};
let currentExerciseIndex = 0;
let repeatExercise = true;
let MAX_FAILURE = 1;
let failCount = 0;
let exerciseHandler = (t, s) => t;
let mobileStenoKeyboard = true;
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
    pyKeyDown(event.key);
}

document.addEventListener('keyup', (event) => { logKeyUp(event) }, false);
function logKeyUp(event) {
    if(ignoreKeyEvent(event)) return ;
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
function resetHint() {
    failCount = 0;
    hints.innerHTML = '';
    showHint(0);
}
function loadExercise(tags) {
    const data = getCards(tags);
    if(0 === Object.keys(data).length) {
        exercise.innerHTML = '';
        return ;
    }
    currentExercise = [...data];
    if(document.getElementById('randomizeExercises').checked) {
        shuffleArray(currentExercise);
    }
    exercise.innerHTML = textToLength().join('\n');
    showHint(0);
    exerciseHandler = (t, s) => {
        console.log(currentExercise.length, t);
        if(currentExercise.length === 0 && repeatExercise) changeExercise();
        if(currentExercise.length === 0) return s;
        let result = t.trim();
        if(undefined !== currentExercise[currentExerciseIndex].word) {
            result = result.split(' ').at(-1);
        }
        if(result === currentExercise[currentExerciseIndex].word) {
            ++currentExerciseIndex;
            exercise.innerHTML = textToLength().join('\n');
            resetHint();
            reset_text();
            return '';
        } else {
            showHint();
        }
        return s;
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
    if(!settingsChanged()) return ;
    currentExerciseIndex = 0;
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
    let i = 1;
    for(let r = 0; r < rowCount && i < currentExercise.length; ++r) {
        let k = 0;
        let color = '#005a00';
        color = '#929292';
        let s = '<span style="color:' + color + '">';
        if(i-1 >= currentExerciseIndex) s += '</span>';
        s += currentExercise[i - 1].word;
        let p = '';
        for(; i <= currentExercise.length; ++i) {
            test.innerHTML = s;
            const height = (test.clientHeight + 1);
            const width = (test.clientWidth + 1);
            if(width > maxWidth) break;
            if(i === currentExerciseIndex) s += '</span>';
            p = s;
            ++k;
            if(i === currentExercise.length) break;
            s += ' ' + currentExercise[i].word;
        }
        if(r === 0 && p.endsWith('</span>')) {
            // remove first row
            for(; k > 0; --k) currentExercise.shift();
            r = -1;
            i = 1;
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
function dayCutOff() {
    const now = new Date;
    const tomorrow = now.getDate()+1
    return Date.UTC(tomorrow.getUTCFullYear(),tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 5, 0, 0, 0).toISOString();
}
function intersect(a, b) {
  var setB = new Set(b);
  return [...new Set(a)].filter(x => setB.has(x));
}
function annotateCardsWithLocalData(cards) { // modifies input
    for(const card of cards) {
        const data = JSON.parse(localStorage.getItem(card.collection + '::' + card.word));
        if(null === data) continue;
        card.scheduling = data;
    }
    return cards;
}
function tags2CollectionAndId(tags) {
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
function getFilterCards(tagsByCollection) {
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
    const tagsByCollection = tags2CollectionAndId(tags);
    const filteredCards = getFilterCards(tagsByCollection);
    annotateCardsWithLocalData(filteredCards);
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
function fsrs() {
    const [fsrsCard, now, fsrsPy] = [{"due": "2023-05-05 11:41:51.284324", "stability": 0, "difficulty": 0, "elapsed_days": 0, "scheduled_days": 0, "reps": 0, "lapses": 0, "state": "New"}, new Date().toISOString(), pyscript.interpreter.globals.get('fsrs')];
    const newCard = fsrsPy.newCardJs();

    JSON.parse(localStorage.getItem(id));
    newCardsPy = fsrsPy.repeatJs(newCard, now).toJs();
    newCards = toObject(newCardsPy);
    return newCards;

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
}
function putCardBack(ease) {
    const now = new Date().toISOString();
    cardFsrsOptionsPy = f.repeatJs(cardData['fsrs'], now).toJs();
    cardFsrsOptions = toObject(cardFsrsOptionsPy);
    cardData['fsrs'] = cardNewFsrsData[ease];
    cardData['answers'].push({'date': now, 'answer': answer, 'ease': ease});
    localStorage.setItem(id, JSON.stringify(cardData));
}
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
loadCards('./rope/cards-all.json');

document.addEventListener("DOMContentLoaded", function(event) {
    setStenoKeyboardWidth(mobileStenoKeyboard);
    if(!isMobile) hideFullScreenButton();
});
