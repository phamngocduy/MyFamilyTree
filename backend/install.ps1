try {
    deactivate
} catch {}
python -m venv --clear python312
python312\scripts\activate
pip install -r library.txt