(async function() {

const start_quiz_button = document.getElementById('start_quiz');
start_quiz_button.addEventListener('click', () => {
    window.location.assign('/instructions')
});
const show_leaderboard_button = document.getElementById('show_leaderboard');
show_leaderboard_button.addEventListener('click', () => {
    window.location.assign('/leaderboard');
});

const response = await fetch('/get-quiz-timing');
if (!response.ok) {
    console.log('failed to get quiz timing');
}
const { close_at } = await response.json();

const answers_button = document.getElementById('show_answers');
answers_button.addEventListener('click', () => {
    if (Date.now() >= close_at) {
	window.location.assign('/answers');
    }
    else {
	alert('answers available only after quiz closes');
    }
});

})();
