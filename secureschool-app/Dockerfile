FROM node:18

# Dossier de travail
WORKDIR /app

# Copie des fichiers de configuration
COPY package*.json ./

# Copie du code source
COPY . .

# Installation des dépendances
RUN npm install

# Exposition du port
EXPOSE 3000

# Démarrage du serveur
CMD ["node", "app.js"]
