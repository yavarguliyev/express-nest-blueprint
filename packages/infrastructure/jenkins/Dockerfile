FROM jenkins/jenkins:lts-jdk17

# Install plugins (using latest versions to avoid conflicts)
RUN jenkins-plugin-cli --plugins \
    configuration-as-code \
    job-dsl \
    git \
    workflow-aggregator \
    docker-workflow \
    matrix-auth \
    cloudbees-folder

# Set user to root for installations
USER root

# Install Docker CLI and Docker Compose
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && apt-get install -y docker-ce-cli docker-compose-plugin && \
    ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose && \
    # Install kubectl (Direct binary download to bypass repository GPG issues)
    K8S_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt) && \
    ARCH=$(dpkg --print-architecture) && \
    curl -LO "https://dl.k8s.io/release/${K8S_VERSION}/bin/linux/${ARCH}/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/kubectl && \
    rm -rf /var/lib/apt/lists/*

# Set user to root (redundant but good practice for clarity with plugins)
USER root
