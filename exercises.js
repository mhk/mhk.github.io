(function(exercises, undefined) {

    /********************************************
     *               Public Methods             *
     ********************************************/

    exercises.getCards = (tags) => {
        const filteredCards = filterCardsByTags(tags);
        if(settings.isFsrs()) {
            return annotateCardsWithLocalData(filteredCards).then(cards => orderCardsDueAndNew(cards));
        } else if(settings.options.randomize.getBool()) {
            shuffleArray(filteredCards);
        }
        return Promise.resolve(filteredCards);
    }
    exercises.getDifficultCards = () => {
        const maxCards = settings.options.maxCards.getInt();
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

            if(settings.options.randomize.getBool()) {
                shuffleArray(result);
            }
            return result;
        });
    }
    exercises.getEstimate = (due) => {
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
    exercises.getCardDifficulties = (card) => {
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
    exercises.putCardBack2 = (card, answer, ease) => {
        const newCards = exercises.getCardDifficulties(card);
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
    exercises.getFsrsStats = (tags) => {
        const filteredCards = filterCardsByTags(tags);
        const minDue = cutOffDate(0);
        const maxDue = cutOffDate();
        const newMax = settings.options.newCards.getInt();
        const cardsMax = settings.options.maxCards.getInt();
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
        return {
            newCardsLearnedToday: newCardsLearnedToday,
            newCardsShownToday  : newCardsShownToday,
            newCardsMax         : newCardsMax,
            cardsLearnedToday   : cardsLearnedToday,
            cardsShownToday     : cardsShownToday,
            dueCardsMax         : dueCardsMax,
            total               : filteredCards.length,
        };
    }

    /********************************************
     *              Private Methods             *
     ********************************************/

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
        const newCardsMax = Math.max(0, settings.options.newCards.getInt() - newCardsLearnedToday);
        const cardsMax = Math.max(0, settings.options.maxCards.getInt() - cardsLearnedToday);
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
        if(settings.options.cardPrios.get() === 'dueOverNew') {
            result = dueCards.concat(newCards);
        } else {
            result = newCards.concat(dueCards);
        }
        result.length = Math.min(result.length, cardsMax);
        if(settings.options.randomize.getBool()) {
            shuffleArray(result);
        }
        return result;
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
}(window.exercises = window.exercises || {}));
