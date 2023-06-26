const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let cards = {};
let cardStartTime = new Date;
let lessonsData = {};
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
let update_text_fct = exerciseHandler;

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
    pyCallback_key_down(event.key);
}

document.addEventListener('keyup', (event) => { logKeyUp(event) }, false);
function logKeyUp(event) {
    if(ignoreKeyEvent(event)) return ;
    if(!Object.values(steno2key).includes(event.key)) return ;
    pyCallback_key_up(event.key);
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
function jsCallback_update_text(t, s) {
    update_text_fct(t, s);
}
function copyDivToClipboard(id) {
    const range = document.createRange();
    range.selectNode(document.getElementById(id));
    window.getSelection().removeAllRanges(); // clear current selection
    window.getSelection().addRange(range); // to select text
    document.execCommand("copy");
    window.getSelection().removeAllRanges();// to deselect
}
function jsCallback_on(key) {
    return on(key);
}
function jsCallback_off(key) {
    return off(key);
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
function jsCallback_stroke(s) {
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
            pyCallback_key_down(steno2key[stenoKey]);
        }
    }
    for (let i = 0; i < collection.length; i++) {
        const stenoKey = collection[i].getAttribute('id');
        if(!isOff(stenoKey)) {
            pyCallback_key_up(steno2key[stenoKey]);
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
    pyCallback_reset_text();
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
        const newCards = exercises.getCardDifficulties(card);
        for(const ease of Object.keys(newCards)) {
            document.getElementById(ease.toLowerCase()).style.padding = '9px 28px';
            document.getElementById(ease.toLowerCase()).innerHTML =
                ease + '<br/><small>' + exercises.getEstimate(newCards[ease].card.due) + '</small>';
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
function isKeyboard() {
    return settings.options.keyboard.getBool();
}
function showFsrsStats(tags) {
    const cardStats = document.getElementById('cardStats');
    cardStats.innerHTML = '';
    if(!settings.isFsrs()) return ;
    const stats = exercises.getFsrsStats(tags);
    cardStats.innerHTML =
        'New: ' + stats.newCardsLearnedToday + '/' + stats.newCardsShownToday + '/' + stats.newCardsMax + ' ' +
        'Total: ' + stats.cardsLearnedToday + '/' + stats.cardsShownToday + '/' + stats.dueCardsMax + '/' + stats.total;
}
function textHandler(t, s) {
    exercise.innerHTML = t;
    steno.innerHTML = s;
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
            if(settings.isFsrs()) {
                putCardBack = ease => {
                    exercises.putCardBack2(curExc, answer_strokes, ease);
                    showFsrsStats(currentTags);
                }
                showDifficulty(curExc);
            } else {
                ++currentExerciseIndex;
                exercise.innerHTML = textToLength().join('\n');
                initNextExercise();
            }
            result = '';
        } else {
            showHint();
        }
        steno.innerHTML = result;
    };
async function loadExercise(tags) {
    const data = await exercises.getCards(tags);
    if(tags.includes('difficult')) {
        const d = await exercises.getDifficultCards();
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
function loadSettings(event) {
    settings.loadSettings(db, (s) => alert(s));
}
function saveSettings(event) {
    settings.saveSettings(db, (s) => alert(s));
}
function deleteSettings(event) {
    settings.deleteSettings(db, (s) => alert(s));
}
function changeExercise() {
    currentExerciseIndex = 0;
    initNextExercise();
    if(!settings.options.exercise.getBool()) return;
    loadExercise(settings.options.tags.get());
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
const touchMove = {};
const lastTouch = {};
function handleStenoTouchMove(point, keys, event) {
    event.preventDefault();
    if(event.changedTouches.length == 0) return ;
    for(let i = 0; i < event.changedTouches.length; ++i) {
        point.x = event.changedTouches[i].clientX;
        point.y = event.changedTouches[i].clientY;
        const cursorpt =  point.matrixTransform(svg.getScreenCTM().inverse());
        for(const key of keys) {
            if(null === key) return ;
            const eid = event.target.id;
            const now = Date.now();;
            if((key.isPointInFill(cursorpt) || key.isPointInStroke(cursorpt)) &&
                0 !== touchMove[eid].length && touchMove[eid].at(-1) !== key.id &&
                now - lastTouch[key.id] > 270) {
                touchMove[eid].push(key.id);
                lastTouch[key.id] = now;
                toggle(key.id);
                break;
            }
        }
    }
}
function handleStenoTouchStart(event) {
    event.preventDefault();
    const eid = event.target.id;
    touchMove[eid] = [eid];
    lastTouch[eid] = Date.now();
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
let putCardBack = ease => exercise.putCardBack2(null, null, ease);
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
function loadCards(deck) {
    fetch(deck)
        .then(response => response.json())
        .then(json => {
            const name = json['name'];
            json['path'] = deck;
            cards[name] = json;

            addCardTags();

            settings.setDomSettings();
            changeDbUrl();
            if(settings.options.exercise.getBool()) {
                loadExercise(settings.options.tags.get());
            }
            setupTouch();
        });
}
function setupTouch() {
    const keys = [];
    Object.keys(steno2key).forEach(id => {
        const key = document.getElementById(id);
        if(null === key) return ;
        keys.push(key);
        lastTouch[id] = 0;
    });
    document.querySelector('svg').addEventListener('touchstart', () => {});
    const point = document.getElementById("svg").createSVGPoint();  // Created once for document
    keys.forEach(key => {
        key.onclick = key.ontouchstart = handleStenoTouchStart;
        key.ontouchmove = (event) => handleStenoTouchMove(point, keys, event);
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
    if(!settings.settingsChanged()) return ;
    settings.setUrlSettings();
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
    if(settings.options.newCards.getInt() > settings.options.maxCards.getInt()) {
        event.target.value = settings.options.maxCards.getDom();
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

loadCards('rope/cards-all.json');
loadLessons('learn-plover/lessons.json');
document.addEventListener("DOMContentLoaded", function(event) {
    setStenoKeyboardWidth(mobileStenoKeyboard);
    if(!isMobile) hideFullScreenButton();
});
