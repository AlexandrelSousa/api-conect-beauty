// No arquivo auth.js
router.post('/login', async (req, res) => {
    try {
        const { emailOuCNPJ, senha } = req.body;

        // Verifica se o usuário existe
        const user = await pool.query('SELECT * FROM cliente WHERE email = $1', [emailOuCNPJ]);
        const cnpj = await pool.query('SELECT * FROM empreendedora WHERE cnpj = $1', [emailOuCNPJ]);

        if (user.rows.length === 0 && cnpj.rows.length === 0) {
            return res.status(401).json({ message: 'Dados de login incorretos.' });
        }

        // Verifica a senha e gera o token
        const validPassword = user.rows.length !== 0 
            ? await bcrypt.compare(senha, user.rows[0].senha)
            : await bcrypt.compare(senha, cnpj.rows[0].senha);

        if (!validPassword) {
            return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });
        }

        const acessToken = user.rows.length !== 0
            ? jwt.sign({ username: user.rows[0].nome, id: user.rows[0].id }, process.env.ACESS_TOKEN_SECRET)
            : jwt.sign({ username: cnpj.rows[0].nome, cnpj: cnpj.rows[0].cnpj }, process.env.ACESS_TOKEN_SECRET);

        res.json({ acessToken: acessToken });

    } catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        res.status(500).json({ message: 'Erro ao autenticar usuário.' });
    }
});
