# <img src="https://raw.githubusercontent.com/phamngocduy/MyFamilyTree/refs/heads/main/favicon.ico" width="50"/> MyFamilyTree
<b>MyFamilyTree</b> is a responsive family tree web-based application to record family members and their relationships, built with JS, Firebase, AWS & GCP.

## Getting Started
```bash
git clone https://github.com/phamngocduy/MyFamilyTree
cd MyFamilyTree
```
### Setup Backend
```bash
backend\install.ps1
```
- Using localhost
```bash
backend\deploy.ps1
```
- Using AWS Lambda Function
```bash
backend\lambda\deploy.ps1
```
- Using GCP Cloud Run
```bash
backend\gcloud\deploy.ps1
```
### Deploy Frontend
```bash
npm install
cd frontend
```
Update the backend details and your Firebase configuration.
Then run `deploy.ps1` to deploy to Firebase hosting.
