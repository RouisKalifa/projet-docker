FROM nginx:alpine

# Supprime la config par défaut de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copie notre configuration personnalisée
COPY nginx.conf /etc/nginx/conf.d/app.conf
