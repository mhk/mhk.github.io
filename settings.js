(function(settings, undefined) {
    const urlParams = new URLSearchParams(window.location.search);
    const radioSetter = (name, value) => [...document.getElementsByName(name)].filter(c => c.value === value).map( c => c.checked = true);
    settings.options = {
        tags: {
            get: () => Object.values(document.querySelectorAll('input[class="tagCheckbox"]:checked')).map(c => c.id),
            getDom: () => Object.values(document.querySelectorAll('input[class="tagCheckbox"]:checked')).map(c => c.id),
            getUrl: () => (urlParams.get('tags') || '').split(',').filter(s => '' !== s) || settings.options.tag.default,
            set: (tags) => {
                const tagSet = new Set(tags);
                [...document.getElementsByClassName("tagCheckbox")].map(c => c.checked = tagSet.has(c.id));
                urlParams.set('tags', [...tagSet].join(','));
            },
            domEqualUrl: () => {
                const urlTags = settings.options.tags.getUrl();
                const domTags = settings.options.tags.getDom();
                const intersection = intersect(domTags, urlTags);
                return intersection.length === domTags.length &&
                    domTags.length === urlTags.length;
            },
            default: [],
        },
        randomize: {
            get: () => document.getElementById('randomizeExercises').checked? '1' : '0',
            getDom: () => document.getElementById('randomizeExercises').checked? '1' : '0',
            getUrl: () => urlParams.get('randomize') || settings.options.randomize.default,
            getBool: () => document.getElementById('randomizeExercises').checked,
            set: (randomize) => {
                document.getElementById('randomizeExercises').checked = (settings.options.randomize.default !== randomize);
                urlParams.set('randomize', randomize);
            },
            domEqualUrl: () => settings.options.randomize.getDom() === settings.options.randomize.getUrl(),
            default: '0',
        },
        hand: {
            get: () => document.querySelector('input[name="handedness"]:checked').value,
            getDom: () => document.querySelector('input[name="handedness"]:checked').value,
            getUrl: () => urlParams.get('hand') || settings.options.hand.default,
            set: (hand) => {
                if('left' === hand) leftHandedStenoKeyboard();
                else rightHandedStenoKeyboard();
                urlParams.set('hand', hand);
            },
            domEqualUrl: () => settings.options.hand.getDom() === settings.options.hand.getUrl(),
            default: 'right',
        },
        scheduler: {
            get:  () => document.querySelector('input[name="trainingType"]:checked').value,
            getDom:  () => document.querySelector('input[name="trainingType"]:checked').value,
            getUrl: () => urlParams.get('scheduler') || settings.options.scheduler.default,
            set: (scheduler) => {
                radioSetter('trainingType', scheduler);
                urlParams.set('scheduler', scheduler);
            },
            domEqualUrl: () => settings.options.scheduler.getDom() === settings.options.scheduler.getUrl(),
            default: 'roundRobin',
        },
        failcount: {
            get: () => document.getElementById('failcount').value,
            getDom: () => document.getElementById('failcount').value,
            getUrl: () => urlParams.get('failcount') || settings.options.failcount.default,
            set: (failcount) => {
                document.getElementById('failcount').value = failcount;
                urlParams.set('failcount', failcount);
                changeMax(undefined, failcount);
            },
            domEqualUrl: () => settings.options.failcount.getDom() === settings.options.failcount.getUrl(),
            default: '2',
        },
        keyboard: {
            get: () => document.getElementById('hideStenoKeyboard').checked? '0' : '1',
            getDom: () => document.getElementById('hideStenoKeyboard').checked? '0' : '1',
            getUrl: () => urlParams.get('keyboard') || settings.options.keyboard.default,
            getBool: () => !document.getElementById('hideStenoKeyboard').checked,
            set: (keyboard) => {
                const hide = (settings.options.keyboard.default !== keyboard);
                document.getElementById('hideStenoKeyboard').checked = hide;
                urlParams.set('keyboard', keyboard);
                if(hide) hideStenoKeyboard();
                else showStenoKeyboard();
            },
            domEqualUrl: () => settings.options.keyboard.getDom() === settings.options.keyboard.getUrl(),
            default: '1',
        },
        newCards: {
            get: () => document.getElementById('newCards').value,
            getDom: () => document.getElementById('newCards').value,
            getUrl: () => urlParams.get('newCards') || settings.options.newCards.default,
            getInt: () => parseInt(document.getElementById('newCards').value),
            set: (newCards) => {
                document.getElementById('newCards').value = newCards;
                urlParams.set('newCards', newCards);
            },
            domEqualUrl: () => settings.options.newCards.getDom() === settings.options.newCards.getUrl(),
            default: '10',
        },
        maxCards: {
            get: () => document.getElementById('maxCards').value,
            getDom: () => document.getElementById('maxCards').value,
            getUrl: () => urlParams.get('maxCards') || settings.options.maxCards.default,
            getInt: () => parseInt(document.getElementById('maxCards').value),
            set: (maxCards) => {
                document.getElementById('maxCards').value = maxCards;
                urlParams.set('maxCards', maxCards);
            },
            domEqualUrl: () => settings.options.maxCards.getDom() === settings.options.maxCards.getUrl(),
            default: '100',
        },
        quickSelect: {
            get: () => document.getElementById('quickSelect').checked? '1' : '0',
            getDom: () => document.getElementById('quickSelect').checked? '1' : '0',
            getUrl: () => urlParams.get('quickSelect') || settings.options.quickSelect.default,
            set: (quickSelect) => {
                document.getElementById('quickSelect').checked = (settings.options.quickSelect.default !== quickSelect);
                urlParams.set('quickSelect', quickSelect);
            },
            domEqualUrl: () => settings.options.quickSelect.getDom() === settings.options.quickSelect.getUrl(),
            default: '0',
        },
        dict: {
            get: () => document.querySelector('input[name="dictionary"]:checked').value,
            getDom: () => document.querySelector('input[name="dictionary"]:checked').value,
            getUrl: () => urlParams.get('dict') || settings.options.dict.default,
            set: (dict) => {
                radioSetter('dictionary', dict);
                urlParams.set('dict', dict);
            },
            domEqualUrl: () => settings.options.dict.getDom() === settings.options.dict.getUrl(),
            default: 'plover',
        },
        cardPrios: {
            get: () => document.querySelector('input[name="cardPrios"]:checked').value,
            getDom: () => document.querySelector('input[name="cardPrios"]:checked').value,
            getUrl: () => urlParams.get('cardPrios') || settings.options.cardPrios.default,
            set: (cardPrios) => {
                radioSetter('cardPrios', cardPrios);
                urlParams.set('cardPrios', cardPrios);
            },
            domEqualUrl: () => settings.options.cardPrios.getDom() === settings.options.cardPrios.getUrl(),
            default: 'newOverDue',
        },
        loop: {
            get: () => settings.options.loop.default,
            getDom: () => settings.options.loop.default,
            getUrl: () => urlParams.get('loop') || settings.options.loop.default,
            set: (loop) => {},
            domEqualUrl: () => settings.options.loop.getDom() === settings.options.loop.getUrl(),
            default: '1',
        },
        dbUrl: {
            get: () => document.getElementById('dbUrl').value,
            getDom: () => document.getElementById('dbUrl').value,
            getUrl: () => urlParams.get('dbUrl') || settings.options.dbUrl.default,
            set: (dbUrl) => {
                document.getElementById('dbUrl').value = dbUrl;
                urlParams.set('dbUrl', dbUrl);
            },
            domEqualUrl: () => settings.options.dbUrl.getDom() === settings.options.dbUrl.getUrl(),
            default: '',
        },
        exercise: {
            get: () => document.getElementById('isExercise').checked? '1' : '0',
            getDom: () => document.getElementById('isExercise').checked? '1' : '0',
            getUrl: () => urlParams.get('isExercise') || settings.options.exercise.default,
            getBool: () => document.getElementById('isExercise').checked,
            set: (isExercise) => {
                const isExcBool = (settings.options.exercise.default === isExercise);
                document.getElementById('isExercise').checked = isExcBool;
                urlParams.set('isExercise', isExercise);
                const div = document.getElementById('divCopyText');
                const exc = document.getElementById('exercise');
                if(isExcBool) {
                    div.style.display = 'none';
                    exc.style.overflow = 'hidden';
                    update_text_fct = exerciseHandler;
                } else {
                    const cardStats = document.getElementById('cardStats');
                    div.style.display = 'inline-block';
                    exc.style.overflow = 'scroll';
                    exc.innerHTML = '';
                    steno.innerHTML = '';
                    cardStats.innerHTML = '';
                    update_text_fct = textHandler;
                }
            },
            domEqualUrl: () => settings.options.exercise.getDom() === settings.options.exercise.getUrl(),
            default: '1',
        },
    };
    settings.settingsChanged = _settingsChanged;

    /********************************************
     *               Public Methods             *
     ********************************************/

	settings.setSettings = (newSettings) => {
        for(const key of Object.keys(newSettings)) {
            const val = newSettings[key];
            settings.options[key].set(val);
        }
        updateUrl();
        return settings;
    }
	settings.setUrlSettings = () => {
		for(const key of Object.keys(settings.options)) {
			const val = settings.options[key].getDom()
            settings.options[key].set(val);
        }
        updateUrl();
        return settings;
    }
    settings.setDomSettings = () => {
        for(const key of Object.keys(settings.options)) {
            const val = settings.options[key].getUrl()
            settings.options[key].set(val);
        }
        return settings;
    }
    settings.getDomSettings = () => {
        return Object.keys(settings.options).reduce((map, key) => {
            map[key] = settings.options[key].getDom();
            return map;
        }, {});
    }
    settings.getUrlSettings = () => {
        return Object.keys(settings.options).reduce((map, key) => {
            map[key] = settings.options[key].getUrl();
            return map;
        }, {});
    }
    settings.isFsrs = () => {
        return settings.options.scheduler.get() === 'FSRS';
    }
    settings.saveSettings = (db, error = (e) => {}, updateUi = () => {}) => {
        const textfield = getSettingsName();
        const name = textfield.value;
        database.db.get('pageSettings').then(data => {
            return data;
        }).catch(err => {
            if('missing' === err.reason) {
                return {
                    _id: 'pageSettings',
                    saves: {},
                };
            }
            error(`Failed to get pageSettings: ${err.reason}`);
            throw err;
        }).then(data => {
            data.saves[name] = settings.getDomSettings();
            return database.db.put(data).then(data => textfield.value = '').catch(err => {
                error(`Failed to save settings`);
                throw err;
            }).then(data => updateUi());
        });
    }
    settings.loadSettings = (db, error = (e) => {}) => {
        const textfield = getSettingsName();
        const name = textfield.value;
        database.db.get('pageSettings').then(data => {
            const newSettings = data.saves[name];
            if(undefined === newSettings) {
                const s = `Failed to find settings '${name}'`;
                console.log(s);
                error(s);
                return ;
            }
            settings.setSettings(newSettings);
            settings.settingsChanged = () => {
                settings.settingsChanged = _settingsChanged;
                return true;
            };
            textfield.value = '';
        });
    }
    settings.deleteSettings = (db, error = (e) => {}, updateUi = () => {}) => {
        const textfield = getSettingsName();
        const name = textfield.value;
        database.db.get('pageSettings').then(data => {
            if(undefined !== data.saves[name]) delete data.saves[name];
            else error(`Failed to find settings '${name}'`);
            return database.db.put(data).then(data => textfield.value = '');
        }).catch(err => {
            error(`Error while getting '${name}'`);
        }).then(data => updateUi());
    }

    /********************************************
     *              Private Methods             *
     ********************************************/

    function _settingsChanged() {
        for(const key of Object.keys(settings.options)) {
            if(!settings.options[key].domEqualUrl()) return true;
        }
        return false;
    }
    function getSettingsName() {
        return document.getElementById('peristedSettings');
    }
    function updateUrl() {
        const refresh = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + urlParams.toString();
        window.history.pushState({ path: refresh }, '', refresh);
    }
    function boolToStr(b) {
        return String(Number(b));
    }
    function StrToBool(s) {
        return Boolean(Number(s));
    }
}(window.settings = window.settings || {}));
