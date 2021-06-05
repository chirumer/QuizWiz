(async function(){

const server_config = require('./server-data/config.json');
const quiz_settings = require('./server-data/quiz_settings.json');
const questions = require('./server-data/questions.json');
const no_of_questions = questions.length;
const time_grace = quiz_settings.time_grace;
const time_per_question = quiz_settings.time_per_question + time_grace;

const path = require('path');
const fetch = require('node-fetch');
const session = require('express-session');
const mongoose = require('mongoose');

await mongoose.connect(server_config.connection_string, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const { Schema } = mongoose;
const participant_schema = new Schema({
    name: {
	type: String,
	lowercase: true,
	required: true
    },
    answers: [Number],
    times_taken: [Number]
});
const Participant = mongoose.model('participants', participant_schema);

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: server_config.secret_token,
    resave: true,
    saveUninitialized: true,
    cookie: {
        sameSite: 'strict',
        maxAge: quiz_settings.quiz_duration 
    }
}));
app.use(express.json());
app.set('view engine', 'pug');

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home', (req, res) => {
    res.redirect('/instructions');
}); // TEMPORARY

const quiz_pages = [
    'registration',
    'quiz',
    'results',
];

const pages = [
    ...quiz_pages,
    'home',
    'instructions',
    'closed',
    'leaderboard',
    '404'
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

app.use('/registration', (req, res, next) => {
    if (req.session.in_quiz) {
	res.redirect('/quiz');
	return;
    }
    else if (req.session.user) {
	res.redirect('/results');
	return;
    }
    next();
});

app.use('/quiz', (req, res, next) => {
    if (!req.session.in_quiz) {
	res.redirect('/');
	return;
    }
    next();
});

app.use('/results', (req, res, next) => {
    if (!req.session.user || req.session.in_quiz) {
	res.redirect('/');
	return;
    }
    next();
});

app.get('/results', (req, res, next) => {
    const total_no_questions = no_of_questions;
    let answers_correct=0, questions_answered=0, time_taken=0;

    req.session.answers.forEach((answer, index) => {
        if (answer != -1) {
            questions_answered++;
        }
        if (answer == questions[index]['answer-index']) {
            answers_correct++;
        }
    });
    req.session.times_taken.forEach(time => {
        time_taken += time;
    });

    res.render(path.join(__dirname, '/public/results/index.pug'), {
        questions_answered,
        answers_correct,
        total_no_questions,
        time_taken
    });
});

pages.forEach(page => {
    app.get('/'+page, (req, res) => {
	res.sendFile(path.join(__dirname, '/public/'+page+'/index.html'));
    });
});

app.get('/is-quiz-open', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const quiz_open = await is_open(server_config.is_open_url);
    res.send(JSON.stringify({ is_open: quiz_open })); 
});

app.get('/get-question', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const session_data = req.session;
    session_data.question_no = session_data.question_no ?? 0;
    if (!(session_data.question_no < no_of_questions)) {
        req.session.in_quiz = false;
        res.send(JSON.stringify({ is_over: true }));
        return;
    }
    const question = questions[session_data.question_no];
    session_data.is_new_question = session_data.is_new_question ?? true;
    if (session_data.is_new_question) {
        session_data.timer_start = Date.now();
    }
    const send_data = {
        "question": question.question,
        "options": question.options,
        "time_left": (time_per_question - time_grace) + (session_data.timer_start - Date.now())
    }
    session_data.is_new_question = false;
    res.send(JSON.stringify(send_data));
});

app.use(express.static('public'));

app.get('*', (req, res) => {
    res.status(404).send('Not Found');
});

app.post('/register-user', async (req, res) => {
    const user = req.body;
    req.session.user = user;
    req.session.in_quiz = true;

    const data = await Participant.create({
	name: user.name,
	answers: Array(no_of_questions).fill(-1),
	times_taken: Array(no_of_questions).fill(-1)
    });
    req.session.db_id = data._id;

    res.sendStatus(200);
});

app.post('/submit-answer', async (req, res) => {
    const user_answer = req.body.answer;
    req.session.answers = req.session.answers ?? Array(no_of_questions).fill(-1);
    req.session.times_taken = req.session.times_taken ?? Array(no_of_questions).fill(-1);
    const time_taken = Date.now() - req.session.timer_start;
    const is_timeout = time_taken > time_per_question; 
    if (!is_timeout) { 
        req.session.answers[req.session.question_no] = user_answer;
        req.session.times_taken[req.session.question_no] = time_taken;
    }
    await Participant.updateOne({
	_id: req.session.db_id
    }, {
	answers: req.session.answers,
	times_taken: req.session.times_taken
    });

    ++req.session.question_no;

    req.session.is_new_question = true;

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ is_timeout }));
});

if (!module.parent) {
    app.listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
    });
}

async function is_open(url) {
    const response = await fetch(url);
    const { is_open } = await response.json();
    return is_open;
}

})();
