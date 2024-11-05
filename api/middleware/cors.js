const cors = require('cors');

// Configuração do CORS
const corsOptions = {
    origin: 'https://conect-beauty-app.vercel.app', // Substitua pela URL do seu front-end
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Permite cookies, se necessário
};

app.use(cors(corsOptions));
