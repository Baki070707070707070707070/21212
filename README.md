# Automattuner Cloud 🤖

A cloud-ready WebApp transformation of the Automattuner engine, deployed on Azure App Service (Linux) via Docker.

> [!WARNING]
> **BETA SOFTWARE**: Treat this system as non-production critical.

## 📁 Project Structure

```
automattuner/
├── app/                # Application code
│   ├── main.py         # Flask Entrypoint
│   └── engine/         # Automattuner Logic (Engine)
├── web/                # UI Assets
├── docker/             # Docker configuration
├── infra/              # Azure Infrastructure (ARM)
└── .github/            # CI/CD Pipelines
```

## 🚀 Deployment Instructions

### 1. Prerequisites
- Azure CLI installed
- GitHub Account
- Azure Subscription

### 2. App Registration (Azure AD)
Create an App Registration in Azure AD (Entra ID) to allow the app to authenticate against your tenants.
- Note down the `Application (client) ID`, `Directory (tenant) ID`, and generate a `Client Secret`.

### 3. Deploy Infrastructure (ARM)
Use the ARM template in `infra/arm/azuredeploy.json` to provision resources.

**Where to put App Registration Data?**
Pass them as parameters when deploying the ARM template. This will configure them securely in the App Service App Settings.

```bash
# Example deployment via Azure CLI
az group create --name rg-automattuner --location westeurope

az deployment group create \
  --resource-group rg-automattuner \
  --template-file infra/arm/azuredeploy.json \
  --parameters \
    aadClientId="<YOUR_CLIENT_ID>" \
    aadClientSecret="<YOUR_CLIENT_SECRET>" \
    aadTenantId="<YOUR_TENANT_ID>" \
    repositoryUrl="<YOUR_GITHUB_REPO_URL>"
```

### 4. Configure GitHub Secrets
For the CI/CD pipeline to work, set the following secrets in your GitHub Repository:

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | Check `az ad sp create-for-rbac` output JSON |

## 🛠️ Local Development

```bash
# Build
docker build -t automattuner -f docker/Dockerfile .
[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](
https://portal.azure.com/#create/Microsoft.Template/uri/
https://raw.githubusercontent.com/Baki070707070707070707070/21212/main/infra/arm/azuredeploy.json
)


# Run
docker run -p 5000:5000 automattuner
```

## 🔗 References
- [IntuneCD Monitor](https://github.com/almenscorner/intunecd-monitor) (Template)
- [Automattuner](https://github.com/Ayoub-Sekoum/automattuner) (Source)
