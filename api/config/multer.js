const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Caminho para a pasta de uploads
const uploadsPath = path.resolve(__dirname, '../uploads');

// Verifica se a pasta 'uploads' existe, caso contrário, cria
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`Pasta '${uploadsPath}' criada com sucesso.`);
} else {
    console.log(`Pasta '${uploadsPath}' já existe.`);
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

// Instância do multer com a configuração de armazenamento
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite opcional de 5MB por arquivo
    fileFilter: (req, file, cb) => {
        // Filtro opcional para aceitar apenas tipos específicos de arquivos
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado. Apenas JPEG, PNG e GIF são permitidos.'));
        }
    }
});

// Exporta o multer configurado
module.exports = upload;
