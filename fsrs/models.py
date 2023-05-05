from datetime import datetime, timedelta
import time
import copy
import math
from typing import Tuple, Optional
from enum import IntEnum


class State(IntEnum):
    New = 0
    Learning = 1
    Review = 2
    Relearning = 3


class Rating(IntEnum):
    Again = 0
    Hard = 1
    Good = 2
    Easy = 3


class ReviewLog:
    rating: int
    elapsed_days: int
    scheduled_days: int
    review: datetime
    state: int

    def __init__(self, rating: int, elapsed_days: int, scheduled_days: int, review: datetime, state: int):
        self.rating = rating
        self.elapsed_days = elapsed_days
        self.scheduled_days = scheduled_days
        self.review = review
        self.state = state

    def toJson(self) -> dict:
        return {
                "rating":           self.rating,
                "elapsed_days":     self.elapsed_days,
                "scheduled_days":   self.scheduled_days,
                "review":           time.mktime(self.review.timetuple()),
                "review_str":       self.review.strftime("%Y-%m-%dT%H:%M:%S.%f%z"),
                "state":            self.state,
                }

class Card:
    due: datetime
    stability: float
    difficulty: float
    elapsed_days: int
    scheduled_days: int
    reps: int
    lapses: int
    state: State
    last_review: datetime

    def __init__(self) -> None:
        self.due = datetime.utcnow()
        self.stability = 0
        self.difficulty = 0
        self.elapsed_days = 0
        self.scheduled_days = 0
        self.reps = 0
        self.lapses = 0
        self.state = State.New
        self.last_review = 0

    def toJson(self) -> dict:
        lr = 0
        lr_s = 0
        if 0 != self.last_review:
            lr = time.mktime(self.last_review.timetuple())
            lr_s = self.last_review.strftime("%Y-%m-%dT%H:%M:%S.%f%z"),
        return {
                "due":             time.mktime(self.due.timetuple()),
                "due_str":         self.due.strftime("%Y-%m-%dT%H:%M:%S.%f%z"),
                "stability":       self.stability,
                "difficulty":      self.difficulty,
                "elapsed_days":    self.elapsed_days,
                "scheduled_days":  self.scheduled_days,
                "reps":            self.reps,
                "lapses":          self.lapses,
                "state":           self.state,
                "last_review":     lr,
                "last_review_str": lr_s
                }

    def get_retrievability(self, now: datetime) -> Optional[float]:
        if self.state == State.Review:
            elapsed_days = max(0, (now - self.last_review).days)
            return math.exp(math.log(0.9) * elapsed_days / self.stability)
        else:
            return None

def dict2card(card_json: dict) -> Card:
    card = Card()
    card.due            = card_json["due"]
    card.stability      = card_json["stability"]
    card.difficulty     = card_json["difficulty"]
    card.elapsed_days   = card_json["elapsed_days"]
    card.scheduled_days = card_json["scheduled_days"]
    card.reps           = card_json["reps"]
    card.lapses         = card_json["lapses"]
    card.state          = card_json["state"]
    card.last_review    = card_json["last_review"]
    return card


class SchedulingInfo:
    card: Card
    review_log: ReviewLog

    def __init__(self, card: Card, review_log: ReviewLog) -> None:
        self.card = card
        self.review_log = review_log

    def toJson(self):
        return {
                "card": self.card.toJson(),
                "review_log": self.review_log.toJson(),
                }


class SchedulingCards:
    again: Card
    hard: Card
    good: Card
    easy: Card

    def __init__(self, card: Card) -> None:
        self.again = copy.deepcopy(card)
        self.hard = copy.deepcopy(card)
        self.good = copy.deepcopy(card)
        self.easy = copy.deepcopy(card)

    def update_state(self, state: State):
        if state == State.New:
            self.again.state = State.Learning
            self.hard.state = State.Learning
            self.good.state = State.Learning
            self.easy.state = State.Review
            self.again.lapses += 1
        elif state == State.Learning or state == State.Relearning:
            self.again.state = state
            self.hard.state = state
            self.good.state = State.Review
            self.easy.state = State.Review
        elif state == State.Review:
            self.again.state = State.Relearning
            self.hard.state = State.Review
            self.good.state = State.Review
            self.easy.state = State.Review
            self.again.lapses += 1

    def schedule(self, now: datetime, hard_interval: float, good_interval: float, easy_interval: float):
        self.again.scheduled_days = 0
        self.hard.scheduled_days = hard_interval
        self.good.scheduled_days = good_interval
        self.easy.scheduled_days = easy_interval
        self.again.due = now + timedelta(minutes=5)
        if hard_interval > 0:
            self.hard.due = now + timedelta(days=hard_interval)
        else:
            self.hard.due = now + timedelta(minutes=10)
        self.good.due = now + timedelta(days=good_interval)
        self.easy.due = now + timedelta(days=easy_interval)

    def record_log(self, card: Card, now: datetime): # -> dict[int, SchedulingInfo]:
        return {
            Rating.Again: SchedulingInfo(self.again,
                                         ReviewLog(Rating.Again, self.again.scheduled_days, card.elapsed_days, now,
                                                   card.state)),
            Rating.Hard: SchedulingInfo(self.hard,
                                        ReviewLog(Rating.Hard, self.hard.scheduled_days, card.elapsed_days, now,
                                                  card.state)),
            Rating.Good: SchedulingInfo(self.good,
                                        ReviewLog(Rating.Good, self.good.scheduled_days, card.elapsed_days, now,
                                                  card.state)),
            Rating.Easy: SchedulingInfo(self.easy,
                                        ReviewLog(Rating.Easy, self.easy.scheduled_days, card.elapsed_days, now,
                                                  card.state)),
        }


class Parameters:
    request_retention: float
    maximum_interval: int
    easy_bonus: float
    hard_factor: float
    w: Tuple[float, ...]

    def __init__(self) -> None:
        self.request_retention = 0.9
        self.maximum_interval = 36500
        self.easy_bonus = 1.3
        self.hard_factor = 1.2
        self.w = (1., 1., 5., -0.5, -0.5, 0.2, 1.4, -0.12, 0.8, 2., -0.2, 0.2, 1.)
