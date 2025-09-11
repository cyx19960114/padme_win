"""Contains a method for generating a random token"""
from secrets import token_urlsafe
from string import ascii_letters
from math import ceil

n_bytes=32
# lazy length evaluation, do not want to do math :D
length_of_secret=len(token_urlsafe(n_bytes))

def generate_token():
    """Generate a token with module-specified length"""
    return token_urlsafe(n_bytes)