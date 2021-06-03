(function(){

const server_config = require('./server-data/config.json');
const questions = jumble_questions(require('./server-data/questions.json'));
const no_of_questions = questions.length;

const path = require('path');
const fetch = require('node-fetch');
const session = require('express-session');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: server_config.secret_token,
    resave: true,
    saveUninitialized: true,
    cookie: {
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1 hour
    }
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('/instructions');
});

const quiz_pages = [
    'instructions',
    'registration',
    'quiz',
    'results'
];

const pages = [
    ...quiz_pages,
    'closed'
];

quiz_pages.forEach(page => {
    app.use('/'+page, async (req, res, next) => {
        if (await is_open(server_config.is_open_url)) {
            next();
            return;
        }
        res.redirect('/closed');
    });
});

pages.forEach(page => {
    app.get('/'+page, (req, res) => {
        res.sendFile(path.join(__dirname, '/public/'+page+'/index.html'));
    });
});

app.get('/get-question', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const session_data = req.session;
    session_data.question_no = session_data.question_no ?? 0;
    if (!(session_data.question_no < no_of_questions)) {
        res.send(JSON.stringify({ is_over: true }));
        return;
    }
    const question = questions[session_data.question_no];
    const send_data = {
        "question": question.question,
        "options": question.options
    }
    res.send(JSON.stringify(send_data));
});

app.use(express.static('public'));

app.post('/register-user', (req, res) => {
    const user = req.body;
    req.session.user = user;
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});

async function is_open(url) {
    const response = await fetch(url);
    const { is_open } = await response.json();
    return is_open;
}

function jumble_questions(questions) {
    return questions; // will implement later
}

})();