const start_quiz_button = document.getElementById('start_quiz');
start_quiz_button.addEventListener('click', () => {
    window.location.assign('/instructions')
});
const show_leaderboard_button = document.getElementById('show_leaderboard');
show_leaderboard_button.addEventListener('click', () => {
    window.location.assign('/leaderboard');
});