const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Caminho para a pasta de uploads
const uploadsPath = path.resolve(__dirname, '../uploads');

// Verifica e cria a pasta de uploads (incluindo diretórios pais, se necessário)
try {
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log(`Pasta '${uploadsPath}' criada com sucesso.`);
    } else {
        console.log(`Pasta '${uploadsPath}' já existe.`);
    }
} catch (error) {
    console.error('Erro ao criar pasta de uploads:', error);
    throw new Error(`Não foi possível criar a pasta de uploads: ${error.message}`);
}

// Configuração do multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsPath); // Define a pasta onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName); // Garante um nome único para cada arquivo
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de tamanho do arquivo (5MB)
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado. Apenas JPEG, PNG e GIF são permitidos.'));
        }
    }
});

module.exports = upload;
