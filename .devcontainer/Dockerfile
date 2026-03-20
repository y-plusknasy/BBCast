FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Install Google Cloud SDK
RUN export DEBIAN_FRONTEND=noninteractive \
    && apt-get update \
    && apt-get install -y apt-transport-https ca-certificates gnupg curl \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
    && apt-get update \
    && apt-get install -y google-cloud-cli \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# ---- JDK 21 (Android SDK の sdkmanager が Java を必要とするため Dockerfile 内でインストール) ----
RUN export DEBIAN_FRONTEND=noninteractive \
    && apt-get update \
    && apt-get install -y openjdk-21-jdk-headless \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/lib/jvm/java-21-openjdk-* /usr/lib/jvm/java-21

ENV JAVA_HOME=/usr/lib/jvm/java-21
ENV PATH=$PATH:$JAVA_HOME/bin

# ---- Android SDK (React Native ローカルビルド用) ----
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

RUN mkdir -p $ANDROID_HOME/cmdline-tools \
    && curl -fsSL -o /tmp/cmdline-tools.zip \
       https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
    && unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools \
    && mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest \
    && rm /tmp/cmdline-tools.zip \
    && yes | sdkmanager --licenses > /dev/null 2>&1 \
    && sdkmanager --install \
       "platform-tools" \
       "build-tools;35.0.0" \
       "build-tools;36.0.0" \
       "platforms;android-35" \
       "platforms;android-36" \
       "ndk;27.1.12297006" \
    && chmod -R a+rwX $ANDROID_HOME
