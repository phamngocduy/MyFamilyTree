python -m venv package\source
package\source\Scripts\activate
pip install -r ..\library.txt
cp -r package\source\lib package\python\lib\python3.12
cp cygrpc.cpython-312-x86_64-linux-gnu.so package\python\lib\python3.12\site-packages\grpc\_cython
compress-archive package\python package\python_layer.zip -force
rd package\source -recurse -force
rd package\python -recurse -force
cp ..\firebase.json package\
cp ..\server.py package\lambda_function.py
cp ..\firestore.py package\
cp ..\business.py package\
deactivate