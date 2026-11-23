```python lineNumbers=true
def reading_time(word_count: int, words_per_minute: int = 225) -> int:
    """Estimate reading time in whole minutes."""
    minutes, remaining_words = divmod(word_count, words_per_minute)
    return minutes + bool(remaining_words)
```
