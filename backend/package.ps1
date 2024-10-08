python -m venv lambda\source
lambda\source\Scripts\activate
pip install -r libraries.txt
cp -r lambda\source\lib lambda\python\lib\python3.12
cp lambda\cygrpc.cpython-312-x86_64-linux-gnu.so lambda\python\lib\python3.12\site-packages\grpc\_cython
compress-archive lambda\python lambda\python_layer.zip -force
rd lambda\source -recurse -force
rd lambda\python -recurse -force
cp server.py lambda\lambda_function.py
cp firestore.py lambda\
cp business.py lambda\
deactivate