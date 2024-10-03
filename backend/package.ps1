python -m venv create_layer
create_layer\Scripts\activate
pip install -r requirements.txt
cp -r create_layer/lib python/lib/python3.12
compress-archive python python.zip
rd create_layer -recurse -force
rd python -recurse -force
