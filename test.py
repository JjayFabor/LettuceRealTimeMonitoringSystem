import os

# Generate a secure random key
secret_key = os.urandom(24)
print(secret_key.hex())