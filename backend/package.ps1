python -m venv lambda\source
lambda\source\Scripts\activate
pip install -r library.txt
cp -r lambda\source\lib lambda\python\lib\python3.12
compress-archive lambda\python lambda\layer.zip
rd lambda\source -recurse -force
rd lambda\python -recurse -force
cp server.py lambda\lambda_function.p
cp firestore.py lambda\
cp business.py lambda\