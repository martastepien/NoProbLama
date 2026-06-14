"""Flesch Reading Ease (0-100, higher = easier) and Flesch-Kincaid Grade Level.

Both formulas penalise long sentences (words/sentence) and long words (syllables/word).
Results feed into the criteria checks in criteria_engine.py.
"""
from __future__ import annotations

from dataclasses import dataclass

from .text_utils import split_sentences, words, syllables_in


@dataclass
class ReadabilityStats:
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    word_count: int
    sentence_count: int
    avg_sentence_length: float
    avg_syllables_per_word: float


def analyze_readability(text: str) -> ReadabilityStats:
    sentences = split_sentences(text)
    tokens = words(text)
    n_words = len(tokens)
    n_sentences = max(1, len(sentences))
    n_syllables = syllables_in(text)

    if n_words == 0:
        return ReadabilityStats(0.0, 0.0, 0, n_sentences, 0.0, 0.0)

    words_per_sentence = n_words / n_sentences
    syllables_per_word = n_syllables / n_words

    # standard Flesch Reading Ease formula; result is clamped to 0-100
    ease = 206.835 - 1.015 * words_per_sentence - 84.6 * syllables_per_word
    ease = max(0.0, min(100.0, ease))

    # Flesch-Kincaid Grade Level (US school grade equivalent); floored at 0
    grade = 0.39 * words_per_sentence + 11.8 * syllables_per_word - 15.59
    grade = max(0.0, grade)

    return ReadabilityStats(
        flesch_reading_ease=round(ease, 1),
        flesch_kincaid_grade=round(grade, 1),
        word_count=n_words,
        sentence_count=len(sentences),
        avg_sentence_length=round(words_per_sentence, 1),
        avg_syllables_per_word=round(syllables_per_word, 2),
    )
