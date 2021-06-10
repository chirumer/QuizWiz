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
    times_taken: [Number],
    no_correct: Number,
    secret: Number,
    time_taken: Number
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

const quiz_pages = [
    'registration',
    'quiz',
    'results',
];

const pages = [
    ...quiz_pages,
    'home',
    'instructions',
    'answers',
    'closed',
    'leaderboard',
    '404'
];

quiz_pages.forEach(page => {
    app.use('/'+page, async (req, res, next) => {
        if (await is_open(server_config.quiz_timing_url)) {
	    next();
            return;
        }
        res.redirect('/closed');
    });
});

app.use('/answers', async (req, res, next) => {
    const response = await fetch(server_config.quiz_timing_url);
    const { close_at } = await response.json();
    if (Date.now() < close_at) {
        res.redirect('/');
        return;
    }
    next();
});

app.use('/instructions', (req, res, next) => {
    if (req.session.in_quiz) {
	res.redirect('/quiz');
	return;
    }
    else if (req.session.user != undefined && !req.session.in_quiz) {
	res.redirect('/results');
	return;
    }
    next();
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
    });
    req.session.times_taken.forEach(time => {
        if (time_taken != -1) {
	    time_taken += time;
	}
    });
    time_taken = Math.round(time_taken/1000)
    answers_correct = req.session.no_correct;

    res.render(path.join(__dirname, '/public/results/index.pug'), {
        questions_answered,
        answers_correct,
        total_no_questions,
        time_taken
    });
});

app.get('/leaderboard', async (req, res) => {
    const limit = 100;

    const top_users = await Participant.find()
	.sort([['no_correct', -1], ['time_taken', 1]])
	.limit(limit);

    users = []
    top_users.forEach(user => {
        users.push({
		'name': user.name, 
		'no_correct': user.no_correct, 
		'time_taken': user.time_taken
	});
    });
    
    res.render(path.join(__dirname, '/public/leaderboard/index.pug'), {
        users
    });
});

app.get('/answers', (req, res) => {
    queries = []
    questions.forEach(question => {
        queries.push({ 
            question: question.question, 
            answer: question.options[question['answer-index']]
        });
    });
    res.render(path.join(__dirname, '/public/answers/index.pug'), { queries });
});

pages.forEach(page => {
    app.get('/'+page, (req, res) => {
	res.sendFile(path.join(__dirname, '/public/'+page+'/index.html'));
    });
});

app.get('/is-quiz-open', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const quiz_open = await is_open(server_config.quiz_timing_url);
    res.send(JSON.stringify({ is_open: quiz_open })); 
});

app.get('/get-quiz-timing', async(req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const response = await fetch(server_config.quiz_timing_url);
    const { open_at, close_at } = await response.json();
    res.send(JSON.stringify({ open_at, close_at }));
});

app.get('/get-question', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const quiz_open = await is_open(server_config.quiz_timing_url);
    if (!quiz_open) {
<<<<<<< HEAD
	res.send(JSON.stringify({ quiz_closed: true }));
=======
	res.send(JSON.stringify({ quiz_closed }));
>>>>>>> 250b9cc28343f782cdb8da06c6ceeb7be25a4449
    }
    const session_data = req.session;
    session_data.question_no = session_data.question_no ?? 0;
    if (!(session_data.question_no < no_of_questions)) {
        req.session.in_quiz = false;
        res.send(JSON.stringify({ is_over: true }));
        return;
    }
    const question = seeded_shuffle(questions, req.session.secret)[session_data.question_no];
    session_data.is_new_question = session_data.is_new_question ?? true;
    if (session_data.is_new_question) {
        session_data.timer_start = Date.now();
    }
    const send_data = {
        "question": question.question,
	"question_no": session_data.question_no,
        "options": seeded_shuffle(question.options, session_data.secret + session_data.question_no),
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
    req.session.secret = Math.floor(Math.random() * 10000);

    const data = await Participant.create({
	name: user.name,
	answers: Array(no_of_questions).fill(-1),
	times_taken: Array(no_of_questions).fill(-1),
	no_correct: 0,
	secret: req.session.secret,
	time_taken: 0
    });
    req.session.db_id = data._id;

    res.sendStatus(200);
});

app.post('/submit-answer', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.body.question_no != req.session.question_no) {
	res.send(JSON.stringify({ lost_sync: true }));
	return; // user question out of sync
    }
    const user_answer = req.body.answer;
    req.session.answers = req.session.answers ?? Array(no_of_questions).fill(-1);
    req.session.times_taken = req.session.times_taken ?? Array(no_of_questions).fill(-1);
    req.session.no_correct = req.session.no_correct ?? 0;
    req.session.time_taken = req.session.time_taken ?? 0;
    const time_taken = Date.now() - req.session.timer_start;
    const is_timeout = time_taken > time_per_question; 
    if (!is_timeout) { 
        req.session.answers[req.session.question_no] = user_answer;
        req.session.times_taken[req.session.question_no] = time_taken;

	const question = seeded_shuffle(questions, req.session.secret)[req.session.question_no];
	req.session.time_taken += time_taken;
	if (
		question.options[question['answer-index']]
		== 
	    	seeded_shuffle(
		    question.options, req.session.secret + req.session.question_no
		)[user_answer]
	) {
	    ++req.session.no_correct;
	}
    }
    await Participant.updateOne({
	_id: req.session.db_id
    }, {
	answers: req.session.answers,
	times_taken: req.session.times_taken,
	no_correct: req.session.no_correct,
	time_taken: req.session.time_taken
    });

    ++req.session.question_no;

    req.session.is_new_question = true;

    res.send(JSON.stringify({ is_timeout }));
});

if (!module.parent) {
    app.listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
    });
}

async function is_open(url) {
    const response = await fetch(url);
    const { open_at, close_at } = await response.json();
    return Date.now() >= open_at && Date.now() < close_at;
}

function seeded_shuffle(arr, seed) {
    arr = arr.slice();
    function srand(seed) {
	let num = seed;
	return () => (num = num * 16807 % 2147483647);
    }
    const rand = srand(seed);
    const rand_limits = (lower, upper) => rand() % (upper-lower+1) + lower;

    for (let last_index = arr.length - 1; last_index > 0; --last_index) {
	const selected_index = rand_limits(0, last_index);
	if (selected_index != last_index) {
	    [
		arr[selected_index], arr[last_index]
	    ] = [
		arr[last_index], arr[selected_index]
	    ];
	}
    }
    return arr;
}

})();
