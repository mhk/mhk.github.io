(function( settings, undefined ) {
    const urlParams = new URLSearchParams(window.location.search);
    const radioSetter = (name, value) => [...document.getElementsByName(name)].filter(c => c.value === value).map( c => c.checked = true);
    settings.options = {
        tags: {
            get: () => Object.values(document.querySelectorAll('input[class="tagCheckbox"]:checked')).map(c => c.id),
            getUrl: () => (urlParams.get('tags') || '').split(',').filter(s => '' !== s) || settings.options.tag.default,
            set: (tags) => {
                const tagSet = new Set(tags);
                [...document.getElementsByClassName("tagCheckbox")].map(c => c.checked = tagSet.has(c.id));
                urlParams.set('tags', [...tagSet].join(','));
            },
            default: [],
        },
        randomize: {
            get: () => document.getElementById('randomizeExercises').checked? '1' : '0',
            getUrl: () => urlParams.get('randomize') || settings.options.randomize.default,
            getBool: () => document.getElementById('randomizeExercises').checked,
            set: (randomize) => {
                document.getElementById('randomizeExercises').checked = (settings.options.randomize.default !== randomize);
                urlParams.set('randomize', randomize);
            },
            default: '0',
        },
        hand: {
            get: () => document.querySelector('input[name="handedness"]:checked').value,
            getUrl: () => urlParams.get('hand') || settings.options.hand.default,
            set: (hand) => {
                if('left' === hand) leftHandedStenoKeyboard();
                else rightHandedStenoKeyboard();
                urlParams.set('hand', hand);
            },
            default: 'right',
        },
        scheduler: {
            get:  () => document.querySelector('input[name="trainingType"]:checked').value,
            getUrl: () => urlParams.get('scheduler') || settings.options.scheduler.default,
            set: (scheduler) => {
                radioSetter('trainingType', scheduler);
                urlParams.set('scheduler', scheduler);
            },
            default: 'roundRobin',
        },
        failcount: {
            get: () => document.getElementById('failcount').value,
            getUrl: () => urlParams.get('failcount') || settings.options.failcount.default,
            set: (failcount) => {
                document.getElementById('failcount').value = failcount;
                urlParams.set('failcount', failcount);
                changeMax(undefined, failcount);
            },
            default: '2',
        },
        keyboard: {
            get: () => document.getElementById('hideStenoKeyboard').checked? '0' : '1',
            getUrl: () => urlParams.get('keyboard') || settings.options.keyboard.default,
            getBool: () => !document.getElementById('hideStenoKeyboard').checked,
            set: (keyboard) => {
                const hide = (settings.options.keyboard.default !== keyboard);
                document.getElementById('hideStenoKeyboard').checked = hide;
                urlParams.set('keyboard', keyboard);
                if(hide) hideStenoKeyboard();
                else showStenoKeyboard();
            },
            default: '1',
        },
        newCards: {
            get: () => document.getElementById('newCards').value,
            getUrl: () => urlParams.get('newCards') || settings.options.newCards.default,
            getInt: () => parseInt(document.getElementById('newCards').value),
            set: (newCards) => {
                document.getElementById('newCards').value = newCards;
                urlParams.set('newCards', newCards);
            },
            default: '10',
        },
        maxCards: {
            get: () => document.getElementById('maxCards').value,
            getUrl: () => urlParams.get('maxCards') || settings.options.maxCards.default,
            getInt: () => parseInt(document.getElementById('maxCards').value),
            set: (maxCards) => {
                document.getElementById('maxCards').value = maxCards;
                urlParams.set('maxCards', maxCards);
            },
            default: '100',
        },
        quickSelect: {
            get: () => document.getElementById('quickSelect').checked? '1' : '0',
            getUrl: () => urlParams.get('quickSelect') || settings.options.quickSelect.default,
            set: (quickSelect) => {
                document.getElementById('quickSelect').checked = (settings.options.quickSelect.default !== quickSelect);
                urlParams.set('quickSelect', quickSelect);
            },
            default: '0',
        },
        dict: {
            get: () => document.querySelector('input[name="dictionary"]:checked').value,
            getUrl: () => urlParams.get('dict') || settings.options.dict.default,
            set: (dict) => {
                radioSetter('dictionary', dict);
                urlParams.set('dict', dict);
            },
            default: 'plover',
        },
        cardPrios: {
            get: () => document.querySelector('input[name="cardPrios"]:checked').value,
            getUrl: () => urlParams.get('cardPrios') || settings.options.cardPrios.default,
            set: (cardPrios) => {
                radioSetter('cardPrios', cardPrios);
                urlParams.set('cardPrios', cardPrios);
            },
            default: 'newOverDue',
        },
        loop: {
            get: () => settings.options.loop.default,
            getUrl: () => urlParams.get('loop') || settings.options.loop.default,
            set: (loop) => {},
            default: '1',
        },
        dbUrl: {
            get: () => document.getElementById('dbUrl').value,
            getUrl: () => urlParams.get('dbUrl') || settings.options.dbUrl.default,
            set: (dbUrl) => {
                document.getElementById('dbUrl').value = dbUrl;
                urlParams.set('dbUrl', dbUrl);
            },
            default: '',
        },
        exercise: {
            get: () => document.getElementById('isExercise').checked? '1' : '0',
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
            default: '1',
        },
    };

	settings.setUrlSettings = () => {
		for(const key of Object.keys(settings.options)) {
			const val = settings.options[key].get()
			settings.options[key].set(val);
		}
		const refresh = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + urlParams.toString();
		window.history.pushState({ path: refresh }, '', refresh);
		return settings;
	}

    settings.setDomSettings = () => {
        for(const key of Object.keys(settings.options)) {
            if('urlParams'  === key) continue;
            const val = settings.options[key].getUrl()
            settings.options[key].set(val);
        }
        changeDbUrl(undefined);
        if(!settings.options.exercise.getBool()) return;
        loadExercise(settings.options.tags.get());
		return settings;
    }

    //Private Property
    var isHot = true;

    //Public Property
    settings.ingredient = "Bacon Strips";

    //Public Method
    settings.fry = function() {
        var oliveOil;

        addItem( "\t\n Butter \n\t" );
        addItem( oliveOil );
        console.log( "Frying " + settings.ingredient );
    };

    //Private Method
    function addItem( item ) {
        if ( item !== undefined ) {
            console.log( "Adding " + $.trim(item) );
        }
    }
}( window.settings = window.settings || {} ));
