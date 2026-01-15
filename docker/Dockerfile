FROM mcr.microsoft.com/powershell:debian-11

# Install Python and pip
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install WinTuner module
RUN pwsh -Command "Set-PSRepository -Name PSGallery -InstallationPolicy Trusted; Install-Module -Name WinTuner -Force -AcceptLicense"

COPY app ./app
COPY web ./web

EXPOSE 5000

CMD ["python", "app/main.py"]
