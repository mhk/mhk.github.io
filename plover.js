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
    // log.textContent += ` Down ${event.code} (${event.key})`;
    pyKeyDown(event.key);
}

document.addEventListener('keyup', (event) => { logKeyUp(event) }, false);
function logKeyUp(event) {
    if(ignoreKeyEvent(event)) return ;
    /*
    if('Backspace' === event.code) {
        log.textContent = ''; 
    }
    log.textContent += ` UP ${event.code} (${event.key})`;
     */
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
function flipStenoKeyboard() {
    if(document.getElementById('svgg').getAttribute('transform') === null) {
        document.getElementById('svgg').setAttribute('transform', 'scale (-1, 1)');
        document.getElementById('svgg').setAttribute('transform-origin', 'center');
    } else {
        document.getElementById('svgg').removeAttribute('transform');
        document.getElementById('svgg').removeAttribute('transform-origin');
    }
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
function loadExercises() {
    const dropdown = document.getElementById('select-exercise');
    for(let i = 0; i < exercises.length; ++i) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = exercises[i].name;
        for(let j = 0; j < exercises[i].chapters.length; ++j) {
            const opt = document.createElement("option");
            const chapter = exercises[i].chapters[j];
            opt.value = opt.innerHTML = chapter.name;
            optgroup.appendChild(opt);
        }
        dropdown.appendChild(optgroup);
    }
}
function changeMax(event, val) {
    MAX_FAILURE = parseInt(val);
    showHint(0);
}
function showHint(i=1) {
    if(currentExercise.length === 0) return ;
    if(-1 === MAX_FAILURE) return ;
    if(failCount + i < MAX_FAILURE) return ;
    failCount += i;
    hints.innerHTML = steno_hints(currentExercise[currentExerciseIndex]);
}
function resetHint() {
    failCount = 0;
    hints.innerHTML = '';
    showHint(0);
}
function loadExercise(ex, chap) {
    const data = getExerciseData(ex, chap);
    if('' === data) {
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
        showHint();
        if(s.trim() === currentExercise[currentExerciseIndex]) {
            ++currentExerciseIndex;
            exercise.innerHTML = textToLength().join('\n');
            resetHint();
            return '';
        }
        return s;
    };
}
function changeExercise() {
    const exercise = document.querySelector('#select-exercise option:checked').parentElement.label
    const chapter = document.getElementById('select-exercise').value;
    currentExerciseIndex = 0;
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('exercise', exercise);
    urlParams.set('chapter', chapter);
    const refresh = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + urlParams.toString();
    console.log("'" + exercise + "' '" + chapter + "'" + " --> " + refresh);
    window.history.pushState({ path: refresh }, '', refresh);
    loadExercise(exercise, chapter);
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
        s += currentExercise[i - 1];
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
            s += ' ' + currentExercise[i];
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
    return Date.UTC(tomorrow.getUTCFullYear(),tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 5, 0, 0, 0);
}
function intersect(a, b) {
  var setB = new Set(b);
  return [...new Set(a)].filter(x => setB.has(x));
}
function getCards(collections, tags) {
    const result = [];
    for(const name of collections) {
        const collection = cards[name];
        if(collection === undefined) continue;
        const filteredCards = Object.values(collection.cards).filter(c => intersect(c.tags, tags).length > 0);
        result.push(...filteredCards);
    }
    return result;
}
function fsrs() {
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
    const [fsrsCard, now, f] = [{"due": 1683279711.0, "due_str": "2023-05-05 11:41:51.284324", "stability": 0, "difficulty": 0, "elapsed_days": 0, "scheduled_days": 0, "reps": 0, "lapses": 0, "state": 0, "last_review": 0, "last_review_str": 0}, new Date().toISOString(), pyscript.interpreter.globals.get('f')];
    const newCard = f.newCardJS();

    localStorage.getItem(id);
    newCardsPy = f.repeatJS(newCard, now).toJs();
    newCards = toObject(newCardsPy);
    return newCards;

    const collection = {'name': 'Plover'};
    const card = {'word': 'the'};
    const id = collection.name + '::' + card.word;
    const ease = 'Again';
    let cardData = localStorage.getItem(id);
    if(null === cardData) {
        const cardFsrsDataPy = f.newCardJS().toJs();
        const cardFsrsData = toObject(cardFsrsDataPy);
        cardData = {'fsrs': cardFsrsData, 'answers': []}
    }
    cardFsrsOptionsPy = f.repeatJS(cardData['fsrs'], now).toJs();
    cardFsrsOptions = toObject(cardFsrsOptionsPy);
    cardData['fsrs'] = cardNewFsrsData[ease];
    cardData['answers'].push({'date': now, 'answer': answer, 'ease': ease});
    localStorage.setItem(id, cardData);
}
function loadCards(deck) {
    fetch(deck)
        .then(response => response.json())
        .then(json => {
            const name = json['name'];
            json['path'] = deck;
            cards[name] = json;

            addCardTags();
        });
}
function cardOverlayOn() {
  document.getElementById("overlay").style.display = "block";
}
function cardOverlayOff() {
  document.getElementById("overlay").style.display = "none";
}
function addCardTags() {
    const list = document.getElementById("cardLabels");
    list.innerHTML = '';
    for(const tag of cards.all.tags) {
        const listItem = document.createElement("li");
        const checkBox = document.createElement("input");
        checkBox.type = 'checkbox';
        checkBox.id = cards.all.name + '::' + tag;
        listItem.appendChild(checkBox);
        listItem.setAttribute('class', 'tagCheckbox');
        listItem.innerHTML += ' ' + tag;
        list.appendChild(listItem);
    }
}
fetch("exercises.json")
    .then(response => response.json())
    .then(json => {
        console.log('exercises loaded')
        exercises = json;
        loadExercises();
        const urlParams = new URLSearchParams(window.location.search);
        const exercise = urlParams.get('exercise') || 'Plover';
        const chapter = urlParams.get('chapter') || 'One Syllable Words';
        document.getElementById('select-exercise').value = chapter;
        loadExercise(exercise, chapter);
        Object.keys(steno2key).forEach(id => {
            const key = document.getElementById(id);
            key.onclick = key.ontouchstart = handleStenoTouch;
        });
    });

loadCards('./rope/cards-all.json');

document.addEventListener("DOMContentLoaded", function(event) {
    setStenoKeyboardWidth(mobileStenoKeyboard);
    if(!isMobile) hideFullScreenButton();
});
